#!/bin/bash

apt-get -y update
apt-get -y install ruby wget curl

curl -sL https://deb.nodesource.com/setup_15.x -o nodesource_setup.sh
chmod +x ./nodesource_setup.sh
apt-get -y install nodejs

wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

cd /home/ubuntu
wget https://aws-codedeploy-us-east-1.s3.amazonaws.com/latest/install
chmod +x ./install
./install auto