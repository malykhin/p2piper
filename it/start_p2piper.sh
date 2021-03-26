#!/bin/bash

apt-get -y update
apt-get -y install ruby wget

wget https://deb.nodesource.com/setup_14.x
sudo chmod +x ./setup_14.x
sudo ./setup_14.x
apt-get -y install nodejs

wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

cd /home/ubuntu
wget https://aws-codedeploy-us-east-1.s3.amazonaws.com/latest/install
chmod +x ./install
./install auto