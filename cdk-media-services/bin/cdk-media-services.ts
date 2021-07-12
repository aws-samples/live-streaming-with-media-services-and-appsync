#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkMediaServicesStack } from '../lib/cdk-media-services-stack';

const app = new cdk.App();
new CdkMediaServicesStack(app, 'CdkMediaServicesStack', { 
    mediaId: "live-xyz",
    streamKey: "stream1",
    mediaLiveInputAccess: "0.0.0.0/0"
});
