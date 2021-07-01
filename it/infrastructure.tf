locals {
  name_prefix        = "p2piper-prod"
  region             = "us-east-1"
  az_a               = "us-east-1a"
  az_b               = "us-east-1b"
  ssl_cerificate_arn = "arn:aws:acm:us-east-1:438280439534:certificate/bfe0c156-a9e3-4a31-84e8-520abedeae5c"

}

terraform {
  required_version = "> 0.12.0"
  backend "s3" {
    bucket = "p2piper-prod-terraform"
    key    = "p2piper.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region  = local.region
  profile = "default"
}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"]
}


resource "aws_vpc" "p2piper_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true

  tags = {
    Name = "${local.name_prefix}_p2piper_vpc"
  }
}

resource "aws_subnet" "p2piper_public_us_east_1a" {
  vpc_id            = aws_vpc.p2piper_vpc.id
  cidr_block        = "10.0.0.0/24"
  availability_zone = local.az_a

  tags = {
    Name = "${local.name_prefix}_${local.az_a}"
  }
}

resource "aws_subnet" "p2piper_public_us_east_1b" {
  vpc_id            = aws_vpc.p2piper_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = local.az_b

  tags = {
    Name = "${local.name_prefix}_${local.az_b}"
  }
}

resource "aws_internet_gateway" "p2piper_vpc_igw" {
  vpc_id = aws_vpc.p2piper_vpc.id

  tags = {
    Name = "${local.name_prefix}_vpc_igw"
  }
}

resource "aws_route_table" "p2piper_vpc_public" {
  vpc_id = aws_vpc.p2piper_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.p2piper_vpc_igw.id
  }

  tags = {
    Name = "${local.name_prefix}_p2piper_vpc_public"
  }
}

resource "aws_route_table_association" "p2piper_vpc_us_east_1a_public" {
  subnet_id      = aws_subnet.p2piper_public_us_east_1a.id
  route_table_id = aws_route_table.p2piper_vpc_public.id
}

resource "aws_route_table_association" "p2piper_vpc_us_east_1b_public" {
  subnet_id      = aws_subnet.p2piper_public_us_east_1b.id
  route_table_id = aws_route_table.p2piper_vpc_public.id
}



resource "aws_security_group" "p2piper_allow_ssh_sg" {
  name   = "${local.name_prefix}_allow_ssh"
  vpc_id = aws_vpc.p2piper_vpc.id

  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}_allow_ssh_sg"
  }
}

resource "aws_security_group" "p2piper_allow_http_sg" {
  name   = "${local.name_prefix}_allow_http"
  vpc_id = aws_vpc.p2piper_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}_allow_http_sg"
  }
}

data "template_file" "p2piper_policy_template" {
  template = file("./templates/p2piper_ec2_policy_template.json")
}

resource "aws_iam_policy" "p2piper_policy" {
  name   = "${local.name_prefix}-p2piper_policy"
  policy = data.template_file.p2piper_policy_template.rendered
}

data "template_file" "p2piper_instance_profile_role_template" {
  template = file("./templates/p2piper_instance_profile_role_template.json")
}

resource "aws_iam_role" "iam_p2piper_instance_profile_role" {
  name               = "${local.name_prefix}-iam_p2piper_instance_profile_role"
  assume_role_policy = data.template_file.p2piper_instance_profile_role_template.rendered
}

resource "aws_iam_instance_profile" "iam_p2piper_instance_profile" {
  name = "${local.name_prefix}-iam_p2piper_instance_profile"
  role = aws_iam_role.iam_p2piper_instance_profile_role.name
}

resource "aws_iam_role_policy_attachment" "iam_p2piper_instance_profile_role_policy_attachment" {
  role       = aws_iam_role.iam_p2piper_instance_profile_role.name
  policy_arn = aws_iam_policy.p2piper_policy.arn
}

resource "aws_launch_configuration" "p2piper_lc" {
  name_prefix = "${local.name_prefix}_"

  image_id      = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = "${local.name_prefix}_p2piper_key"

  security_groups             = [aws_security_group.p2piper_allow_http_sg.id, aws_security_group.p2piper_allow_ssh_sg.id, aws_security_group.p2piper_allow_redis_sg.id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.iam_p2piper_instance_profile.name
  user_data            = file("start_p2piper.sh")

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "p2piper_alb_http_sg" {
  name   = "${local.name_prefix}_alb_http"
  vpc_id = aws_vpc.p2piper_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}_alb_http"
  }
}

resource "aws_lb" "p2piper_alb" {
  name               = "${local.name_prefix}-alb"
  load_balancer_type = "application"

  subnets = [
    aws_subnet.p2piper_public_us_east_1a.id,
    aws_subnet.p2piper_public_us_east_1b.id
  ]

  security_groups = [
    aws_security_group.p2piper_alb_http_sg.id
  ]

  enable_cross_zone_load_balancing = true
}

resource "aws_lb_listener" "p2piper_alb_listener_https" {
  load_balancer_arn = aws_lb.p2piper_alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = local.ssl_cerificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.p2piper_alb_tg.arn
  }
}

resource "aws_lb_listener" "p2piper_alb_listener" {
  load_balancer_arn = aws_lb.p2piper_alb.arn

  port     = 80
  protocol = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_target_group" "p2piper_alb_tg" {
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.p2piper_vpc.id

  load_balancing_algorithm_type = "least_outstanding_requests"

  stickiness {
    enabled = true
    type    = "lb_cookie"
  }

  health_check {
    healthy_threshold   = 2
    interval            = 30
    protocol            = "HTTP"
    unhealthy_threshold = 2
  }

  depends_on = [
    aws_lb.p2piper_alb
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_attachment" "p2piper_lb_autoscale_attachment" {
  autoscaling_group_name = aws_autoscaling_group.p2piper_autoscaling_group.name
  alb_target_group_arn   = aws_lb_target_group.p2piper_alb_tg.arn
}


resource "aws_autoscaling_group" "p2piper_autoscaling_group" {
  name = "${local.name_prefix}-asg"

  min_size         = 1
  desired_capacity = 1
  max_size         = 1

  health_check_type = "EC2"

  launch_configuration = aws_launch_configuration.p2piper_lc.name

  target_group_arns = [aws_lb_target_group.p2piper_alb_tg.arn]

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  metrics_granularity = "1Minute"

  vpc_zone_identifier = [
    aws_subnet.p2piper_public_us_east_1a.id,
    aws_subnet.p2piper_public_us_east_1b.id
  ]

  lifecycle {
    create_before_destroy = true
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-p2piper_autoscaling_group"
    propagate_at_launch = true
  }
}

resource "aws_route53_zone" "p2piper_route53_zone" {
  name = "p2piper.com"
}

resource "aws_subnet" "p2piper_redis_sunbet_a" {
  vpc_id            = aws_vpc.p2piper_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = local.az_a
  tags = {
    Name = "${local.name_prefix}-redis-subnet-a"
  }
}

resource "aws_subnet" "p2piper_redis_sunbet_b" {
  vpc_id            = aws_vpc.p2piper_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = local.az_b

  tags = {
    Name = "${local.name_prefix}-redis-subnet-b"
  }
}

resource "aws_elasticache_subnet_group" "p2pier_subnet_group" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = [aws_subnet.p2piper_redis_sunbet_a.id, aws_subnet.p2piper_redis_sunbet_b.id]
}

resource "aws_elasticache_cluster" "p2piper_redis" {
  cluster_id           = "${local.name_prefix}-cluster-example"
  engine               = "redis"
  node_type            = "cache.t2.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis3.2"
  engine_version       = "3.2.10"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.p2pier_subnet_group.name
  security_group_ids   = [aws_security_group.p2piper_allow_redis_sg.id]
}

resource "aws_security_group" "p2piper_allow_redis_sg" {
  name   = "${local.name_prefix}_allow_redis"
  vpc_id = aws_vpc.p2piper_vpc.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}_allow_redis_sg"
  }
}
