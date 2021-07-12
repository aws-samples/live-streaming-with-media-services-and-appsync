import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkMediaServices from '../lib/cdk-media-services-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CdkMediaServices.CdkMediaServicesStack(app, 'MyTestStack', { 
      mediaId: "live-xyz",
      streamKey: "stream1",
      mediaLiveInputAccess: "0.0.0.0/0"
    });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
