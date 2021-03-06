#!/bin/bash

sudo cp /home/ubuntu/app/amazon-cloudwatch-agent.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

cd /home/ubuntu/app

sudo ./node_modules/pm2/bin/pm2 delete all
sudo ./node_modules/pm2/bin/pm2 start ./ecosystem.config.js