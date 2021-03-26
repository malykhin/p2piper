#!/bin/bash

sudo cp /home/ubuntu/app/amazon-cloudwatch-agent.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

sudo /home/ubuntu/app/node_modules/pm2/bin/pm2 start /home/ubuntu/app/ecosystem.config.js