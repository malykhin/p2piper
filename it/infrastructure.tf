locals {
  name_prefix = "p2piper-prod"
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
  region  = "us-east-1"
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
  availability_zone = "us-east-1a"

  tags = {
    Name = "${local.name_prefix}_us-east-1a"
  }
}

resource "aws_subnet" "p2piper_public_us_east_1b" {
  vpc_id            = aws_vpc.p2piper_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "${local.name_prefix}_us-east-1b"
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

  security_groups             = [aws_security_group.p2piper_allow_http_sg.id, aws_security_group.p2piper_allow_redis_sg.id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.iam_p2piper_instance_profile.name
  user_data            = file("start_p2piper.sh")

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "p2piper_elb_http_sg" {
  name   = "${local.name_prefix}_elb_http"
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
    Name = "${local.name_prefix}_elb_http"
  }
}

resource "aws_elb" "p2piper_elb" {
  name = "${local.name_prefix}-elb"
  security_groups = [
    aws_security_group.p2piper_elb_http_sg.id
  ]
  subnets = [
    aws_subnet.p2piper_public_us_east_1a.id,
    aws_subnet.p2piper_public_us_east_1b.id
  ]

  cross_zone_load_balancing = true

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 30
    target              = "HTTP:80/"
  }

  listener {
    lb_port           = 80
    lb_protocol       = "http"
    instance_port     = "80"
    instance_protocol = "http"
  }

}

resource "aws_autoscaling_group" "p2piper_autoscaling_group" {
  name = "${local.name_prefix}-asg"

  min_size         = 1
  desired_capacity = 2
  max_size         = 2

  health_check_type = "ELB"
  load_balancers = [
    aws_elb.p2piper_elb.id
  ]

  launch_configuration = aws_launch_configuration.p2piper_lc.name

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

resource "aws_route53_record" "p2piper" {
  zone_id = aws_route53_zone.p2piper_route53_zone.zone_id
  name    = "p2piper.com"
  type    = "A"

  alias {
    name                   = aws_elb.p2piper_elb.dns_name
    zone_id                = aws_elb.p2piper_elb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_subnet" "p2piper_redis_sunbet_a" {
  vpc_id            = aws_vpc.p2piper_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "${local.name_prefix}-redis-subnet-a"
  }
}

resource "aws_subnet" "p2piper_redis_sunbet_b" {
  vpc_id            = aws_vpc.p2piper_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1b"

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
