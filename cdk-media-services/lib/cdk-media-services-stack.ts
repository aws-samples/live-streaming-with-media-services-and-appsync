import * as cdk from '@aws-cdk/core';
import * as medialive from '@aws-cdk/aws-medialive';
import * as mediastore from '@aws-cdk/aws-mediastore';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as iam from '@aws-cdk/aws-iam';
import { Fn, CfnParameter, CfnOutput } from "@aws-cdk/core";

interface CdkMediaServicesStackProps extends cdk.StackProps{
    mediaId: string,
    streamKey: string,
    mediaLiveInputAccess: string
}

export class CdkMediaServicesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: CdkMediaServicesStackProps) {
    super(scope, id, props);
    
    const mediaId = new CfnParameter(this, "mediaId", {
        type: "String", 
        description: "The media Id for live services.", 
        default: props.mediaId
    });
    
    const streamKey = new CfnParameter(this, "streamKey", {
        type: "String", 
        description: "The stream key for rtmp.", 
        default: props.streamKey
    });
    
    const mediaLiveInputAccess = new CfnParameter(this, "mediaLiveInputAccess", {
        type: "String", 
        description: "The media live input access.", 
        default: props.mediaLiveInputAccess
    });
    
    const MediaStoreContainer = new mediastore.CfnContainer(this, 'MediaStoreContainer', {
            containerName: this.stackName,
            accessLoggingEnabled: true,
            corsPolicy: [
                {
                    allowedOrigins: [
                        "*"
                    ],
                    allowedMethods: [
                        "GET"
                    ],
                    allowedHeaders: [
                        "*"
                    ],
                    maxAgeSeconds: 3000
                },
                {
                    allowedOrigins: [
                        "*"
                    ],
                    allowedMethods: [
                        "GET",
                        "PUT"
                    ],
                    allowedHeaders: [
                        "*"
                    ],
                    maxAgeSeconds: 0
                }
            ],
            lifecyclePolicy: "{\n  \"rules\": [\n    {\n      \"definition\": {\n        \"path\": [\n          {\n            \"prefix\": \"\"\n          }\n        ],\n        \"days_since_create\": [\n          {\n            \"numeric\": [\n              \">\",\n              1\n            ]\n          }\n        ]\n      },\n      \"action\": \"EXPIRE\"\n    }\n  ]\n}",
            policy: 
           "{\n  \"Version\" : \"2012-10-17\",\n  \"Statement\" : [ {\n    \"Sid\" : \"MediaStoreCloudFrontAcccess\",\n    \"Effect\" : \"Allow\",\n    \"Principal\" : \"*\",\n    \"Action\" : [ \"mediastore:GetObject\", \"mediastore:DescribeObject\" ],\n    \"Resource\" : \"arn:aws:mediastore:"+this.region+":"+this.account+":container/"+this.stackName+"/*\",\n    \"Condition\" : {\n      \"StringEquals\" : {\n        \"aws:UserAgent\" : \""+mediaId.valueAsString+"\"\n     },\n      \"Bool\" : {\n        \"aws:SecureTransport\" : \"true\"\n      }\n    }\n  } ]\n}",
           
        });
        
    new CfnOutput(this, 'Data Endpoint', { value: MediaStoreContainer.attrEndpoint});

    const noHttps = Fn.select(1, Fn.split('//', MediaStoreContainer.attrEndpoint));
    
    const CloudFrontDistribution = new cloudfront.CfnDistribution(this, 'CloudFrontDistribution', {
        distributionConfig: {
            origins: [
                {
                    connectionAttempts: 3,
                    connectionTimeout: 10,
                    customOriginConfig: {
                        httpPort: 80,
                        httpsPort: 443,
                        originKeepaliveTimeout: 5,
                        originProtocolPolicy: "https-only",
                        originReadTimeout: 30,
                        originSslProtocols: [
                            "SSLv3",
                            "TLSv1"
                        ]
                    },
                    domainName: noHttps,
                    id: "mediastore",
                    originCustomHeaders: [
                        {
                        headerName: "User-Agent",
                        headerValue: mediaId.valueAsString
                        }
                    ],
                    originPath: ""
                }
            ],
            originGroups: {
                quantity: 0
            },
            defaultCacheBehavior: {
                allowedMethods: [
                    "HEAD",
                    "GET",
                    "OPTIONS"
                ],
                cachedMethods: [
                    "HEAD",
                    "GET",
                    "OPTIONS"
                ],
                compress: false,
                defaultTtl: 86400,
                forwardedValues: {
                    cookies: {
                        forward: "none"
                    },
                    headers: [
                        "Origin",
                        "Access-Control-Request-Method",
                        "Access-Control-Allow-Origin",
                        "Access-Control-Request-Header"
                    ],
                    queryString: true
                },
                maxTtl: 31536000,
                minTtl: 0,
                smoothStreaming: false,
                targetOriginId: "mediastore",
                viewerProtocolPolicy: "allow-all"
            },
            comment: "LiveStreamingwithMediaStore Live streaming with MediaLive and MediaStore",
            priceClass: "PriceClass_All",
            enabled: true,
            viewerCertificate: {
                cloudFrontDefaultCertificate: true,
                minimumProtocolVersion: "TLSv1"
            },
            restrictions: {
                geoRestriction: {
                    restrictionType: "none"
                }
            },
            httpVersion: "http1.1",
            defaultRootObject: "",
            ipv6Enabled: true
        }
    });
    
    const MediaLiveInputSecurityGroup = new medialive.CfnInputSecurityGroup(this, 'MediaLiveInputSecurityGroup', {
        whitelistRules: [
            {
                cidr: mediaLiveInputAccess.valueAsString
            }
        ],
        tags: {
            
        }
    });

    const MediaLiveInput = new medialive.CfnInput(this, 'MediaLiveInput', {
        name: mediaId.valueAsString+"-input",
        tags: {
            
        },
        type: "RTMP_PUSH",
        destinations: [
            {
                streamName: mediaId.valueAsString+"/"+streamKey.valueAsString
            }
        ],
        inputSecurityGroups: [
          MediaLiveInputSecurityGroup.ref  ],
    });
    
    new CfnOutput(this, 'MediaLiveInputID', { value: MediaLiveInput.ref});
    new CfnOutput(this, 'MediaLiveEndpoint', { value: Fn.join('', [ Fn.select(0, MediaLiveInput.attrDestinations) ] ) });
        
    const role = new iam.Role(this, 'MediaLiveAccessRole-'+this.stackName, { 
      managedPolicies: [ { managedPolicyArn: "arn:aws:iam::aws:policy/AmazonS3FullAccess" }, { managedPolicyArn: "arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess" }, { managedPolicyArn: "arn:aws:iam::aws:policy/AWSElementalMediaPackageFullAccess" }, { managedPolicyArn: "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess" }, { managedPolicyArn: "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess" }, { managedPolicyArn: "arn:aws:iam::aws:policy/AWSElementalMediaStoreFullAccess" },], 
      assumedBy: new iam.ServicePrincipal('medialive.amazonaws.com')
    });
    
    const MediaLiveChannel = new medialive.CfnChannel(this, 'MediaLiveChannel', {
        channelClass: "SINGLE_PIPELINE",
        destinations: [
            {
                id: "destination1",
                settings: [
                    {
                        url: "mediastoressl://"+noHttps+"/"+MediaLiveInput.ref+"/index"
                    }
                ]
            }
        ],
        encoderSettings: {
            audioDescriptions: [
                {
                    audioSelectorName: "Default",
                    audioTypeControl: "FOLLOW_INPUT",
                    codecSettings: {
                        aacSettings: {
                            bitrate: 192000,
                            codingMode: "CODING_MODE_2_0",
                            inputType: "NORMAL",
                            profile: "LC",
                            rateControlMode: "CBR",
                            rawFormat: "NONE",
                            sampleRate: 48000,
                            spec: "MPEG4"
                        }
                    },
                    languageCodeControl: "FOLLOW_INPUT",
                    name: "audio_1"
                },
                {
                    audioSelectorName: "Default",
                    audioTypeControl: "FOLLOW_INPUT",
                    codecSettings: {
                        aacSettings: {
                            bitrate: 192000,
                            codingMode: "CODING_MODE_2_0",
                            inputType: "NORMAL",
                            profile: "LC",
                            rateControlMode: "CBR",
                            rawFormat: "NONE",
                            sampleRate: 48000,
                            spec: "MPEG4"
                        }
                    },
                    languageCodeControl: "FOLLOW_INPUT",
                    name: "audio_2"
                },
                {
                    audioSelectorName: "Default",
                    audioTypeControl: "FOLLOW_INPUT",
                    codecSettings: {
                        aacSettings: {
                            bitrate: 128000,
                            codingMode: "CODING_MODE_2_0",
                            inputType: "NORMAL",
                            profile: "LC",
                            rateControlMode: "CBR",
                            rawFormat: "NONE",
                            sampleRate: 48000,
                            spec: "MPEG4"
                        }
                    },
                    languageCodeControl: "FOLLOW_INPUT",
                    name: "audio_3"
                },
                {
                    audioSelectorName: "Default",
                    audioTypeControl: "FOLLOW_INPUT",
                    codecSettings: {
                        aacSettings: {
                            bitrate: 128000,
                            codingMode: "CODING_MODE_2_0",
                            inputType: "NORMAL",
                            profile: "LC",
                            rateControlMode: "CBR",
                            rawFormat: "NONE",
                            sampleRate: 48000,
                            spec: "MPEG4"
                        }
                    },
                    languageCodeControl: "FOLLOW_INPUT",
                    name: "audio_4"
                }
            ],
            outputGroups: [
                {
                    name: "HD",
                    outputGroupSettings: {
                        hlsGroupSettings: {
                            captionLanguageSetting: "OMIT",
                            clientCache: "ENABLED",
                            codecSpecification: "RFC_4281",
                            destination: {
                                destinationRefId: "destination1"
                            },
                            directoryStructure: "SINGLE_DIRECTORY",
                            hlsCdnSettings: {
                                hlsMediaStoreSettings: {
                                    connectionRetryInterval: 1,
                                    filecacheDuration: 300,
                                    mediaStoreStorageClass: "TEMPORAL",
                                    numRetries: 10,
                                    restartDelay: 15
                                }
                            },
                            hlsId3SegmentTagging: "DISABLED",
                            iFrameOnlyPlaylists: "DISABLED",
                            indexNSegments: 10,
                            inputLossAction: "EMIT_OUTPUT",
                            ivInManifest: "INCLUDE",
                            ivSource: "FOLLOWS_SEGMENT_NUMBER",
                            keepSegments: 21,
                            manifestCompression: "NONE",
                            manifestDurationFormat: "INTEGER",
                            mode: "LIVE",
                            outputSelection: "MANIFESTS_AND_SEGMENTS",
                            programDateTime: "EXCLUDE",
                            programDateTimePeriod: 600,
                            redundantManifest: "DISABLED",
                            segmentLength: 2,
                            segmentationMode: "USE_SEGMENT_DURATION",
                            segmentsPerSubdirectory: 10000,
                            streamInfResolution: "INCLUDE",
                            timedMetadataId3Frame: "PRIV",
                            timedMetadataId3Period: 10,
                            tsFileMode: "SEGMENTED_FILES"
                        }
                    },
                    outputs: [
                        {
                            audioDescriptionNames: [
                                "audio_1"
                            ],
                            outputSettings: {
                                hlsOutputSettings: {
                                    hlsSettings: {
                                        standardHlsSettings: {
                                            audioRenditionSets: "program_audio",
                                            m3U8Settings: {
                                                audioFramesPerPes: 4,
                                                audioPids: "492-498",
                                                ecmPid: "8182",
                                                pcrControl: "PCR_EVERY_PES_PACKET",
                                                pmtPid: "480",
                                                programNum: 1,
                                                scte35Behavior: "NO_PASSTHROUGH",
                                                scte35Pid: "500",
                                                timedMetadataBehavior: "NO_PASSTHROUGH",
                                                timedMetadataPid: "502",
                                                videoPid: "481"
                                            }
                                        }
                                    },
                                    nameModifier: "_720p60"
                                }
                            },
                            videoDescriptionName: "video_720p60"
                        },
                        {
                            audioDescriptionNames: [
                                "audio_2"
                            ],
                            outputSettings: {
                                hlsOutputSettings: {
                                    hlsSettings: {
                                        standardHlsSettings: {
                                            audioRenditionSets: "program_audio",
                                            m3U8Settings: {
                                                audioFramesPerPes: 4,
                                                audioPids: "492-498",
                                                ecmPid: "8182",
                                                pcrControl: "PCR_EVERY_PES_PACKET",
                                                pmtPid: "480",
                                                programNum: 1,
                                                scte35Behavior: "NO_PASSTHROUGH",
                                                scte35Pid: "500",
                                                timedMetadataBehavior: "NO_PASSTHROUGH",
                                                timedMetadataPid: "502",
                                                videoPid: "481"
                                            }
                                        }
                                    },
                                    nameModifier: "_720p30"
                                }
                            },
                            videoDescriptionName: "video_720p30"
                        },
                        {
                            audioDescriptionNames: [
                                "audio_3"
                            ],
                            outputSettings: {
                                hlsOutputSettings: {
                                    hlsSettings: {
                                        standardHlsSettings: {
                                            audioRenditionSets: "program_audio",
                                            m3U8Settings: {
                                                audioFramesPerPes: 4,
                                                audioPids: "492-498",
                                                ecmPid: "8182",
                                                pcrControl: "PCR_EVERY_PES_PACKET",
                                                pmtPid: "480",
                                                programNum: 1,
                                                scte35Behavior: "NO_PASSTHROUGH",
                                                scte35Pid: "500",
                                                timedMetadataBehavior: "NO_PASSTHROUGH",
                                                timedMetadataPid: "502",
                                                videoPid: "481"
                                            }
                                        }
                                    },
                                    nameModifier: "_480p30"
                                }
                            },
                            videoDescriptionName: "video_480p30"
                        },
                        {
                            audioDescriptionNames: [
                                "audio_4"
                            ],
                            outputSettings: {
                                hlsOutputSettings: {
                                    hlsSettings: {
                                        standardHlsSettings: {
                                            audioRenditionSets: "program_audio",
                                            m3U8Settings: {
                                                audioFramesPerPes: 4,
                                                audioPids: "492-498",
                                                ecmPid: "8182",
                                                pcrControl: "PCR_EVERY_PES_PACKET",
                                                pmtPid: "480",
                                                programNum: 1,
                                                scte35Behavior: "NO_PASSTHROUGH",
                                                scte35Pid: "500",
                                                timedMetadataBehavior: "NO_PASSTHROUGH",
                                                timedMetadataPid: "502",
                                                videoPid: "481"
                                            }
                                        }
                                    },
                                    nameModifier: "_240p30"
                                }
                            },
                            videoDescriptionName: "video_240p30"
                        }
                    ]
                }
            ],
            timecodeConfig: {
                source: "SYSTEMCLOCK"
            },
            videoDescriptions: [
                {
                    codecSettings: {
                        h264Settings: {
                            adaptiveQuantization: "HIGH",
                            afdSignaling: "NONE",
                            bitrate: 5000000,
                            colorMetadata: "INSERT",
                            entropyEncoding: "CABAC",
                            flickerAq: "ENABLED",
                            framerateControl: "SPECIFIED",
                            framerateDenominator: 1,
                            framerateNumerator: 60,
                            gopBReference: "DISABLED",
                            gopClosedCadence: 1,
                            gopNumBFrames: 1,
                            gopSize: 120,
                            gopSizeUnits: "FRAMES",
                            level: "H264_LEVEL_AUTO",
                            lookAheadRateControl: "HIGH",
                            numRefFrames: 3,
                            parControl: "INITIALIZE_FROM_SOURCE",
                            profile: "HIGH",
                            rateControlMode: "CBR",
                            scanType: "PROGRESSIVE",
                            sceneChangeDetect: "ENABLED",
                            slices: 1,
                            spatialAq: "ENABLED",
                            syntax: "DEFAULT",
                            temporalAq: "ENABLED",
                            timecodeInsertion: "DISABLED"
                        }
                    },
                    height: 720,
                    name: "video_720p60",
                    respondToAfd: "NONE",
                    scalingBehavior: "DEFAULT",
                    sharpness: 100,
                    width: 1280
                },
                {
                    codecSettings: {
                        h264Settings: {
                            adaptiveQuantization: "HIGH",
                            afdSignaling: "NONE",
                            bitrate: 3000000,
                            colorMetadata: "INSERT",
                            entropyEncoding: "CABAC",
                            flickerAq: "ENABLED",
                            framerateControl: "SPECIFIED",
                            framerateDenominator: 1,
                            framerateNumerator: 30,
                            gopBReference: "DISABLED",
                            gopClosedCadence: 1,
                            gopNumBFrames: 1,
                            gopSize: 60,
                            gopSizeUnits: "FRAMES",
                            level: "H264_LEVEL_AUTO",
                            lookAheadRateControl: "HIGH",
                            numRefFrames: 3,
                            parControl: "INITIALIZE_FROM_SOURCE",
                            profile: "HIGH",
                            rateControlMode: "CBR",
                            scanType: "PROGRESSIVE",
                            sceneChangeDetect: "ENABLED",
                            slices: 1,
                            spatialAq: "ENABLED",
                            syntax: "DEFAULT",
                            temporalAq: "ENABLED",
                            timecodeInsertion: "DISABLED"
                        }
                    },
                    height: 720,
                    name: "video_720p30",
                    respondToAfd: "NONE",
                    scalingBehavior: "DEFAULT",
                    sharpness: 100,
                    width: 1280
                },
                {
                    codecSettings: {
                        h264Settings: {
                            adaptiveQuantization: "HIGH",
                            afdSignaling: "NONE",
                            bitrate: 1500000,
                            colorMetadata: "INSERT",
                            entropyEncoding: "CABAC",
                            flickerAq: "ENABLED",
                            framerateControl: "SPECIFIED",
                            framerateDenominator: 1,
                            framerateNumerator: 30,
                            gopBReference: "ENABLED",
                            gopClosedCadence: 1,
                            gopNumBFrames: 3,
                            gopSize: 60,
                            gopSizeUnits: "FRAMES",
                            level: "H264_LEVEL_AUTO",
                            lookAheadRateControl: "HIGH",
                            numRefFrames: 3,
                            parControl: "SPECIFIED",
                            parDenominator: 3,
                            parNumerator: 4,
                            profile: "MAIN",
                            rateControlMode: "CBR",
                            scanType: "PROGRESSIVE",
                            sceneChangeDetect: "ENABLED",
                            slices: 1,
                            spatialAq: "ENABLED",
                            syntax: "DEFAULT",
                            temporalAq: "ENABLED",
                            timecodeInsertion: "DISABLED"
                        }
                    },
                    height: 480,
                    name: "video_480p30",
                    respondToAfd: "NONE",
                    scalingBehavior: "STRETCH_TO_OUTPUT",
                    sharpness: 100,
                    width: 640
                },
                {
                    codecSettings: {
                        h264Settings: {
                            adaptiveQuantization: "HIGH",
                            afdSignaling: "NONE",
                            bitrate: 750000,
                            colorMetadata: "INSERT",
                            entropyEncoding: "CABAC",
                            flickerAq: "ENABLED",
                            framerateControl: "SPECIFIED",
                            framerateDenominator: 1,
                            framerateNumerator: 30,
                            gopBReference: "ENABLED",
                            gopClosedCadence: 1,
                            gopNumBFrames: 3,
                            gopSize: 60,
                            gopSizeUnits: "FRAMES",
                            level: "H264_LEVEL_AUTO",
                            lookAheadRateControl: "HIGH",
                            numRefFrames: 3,
                            parControl: "SPECIFIED",
                            parDenominator: 3,
                            parNumerator: 4,
                            profile: "MAIN",
                            rateControlMode: "CBR",
                            scanType: "PROGRESSIVE",
                            sceneChangeDetect: "ENABLED",
                            slices: 1,
                            spatialAq: "ENABLED",
                            syntax: "DEFAULT",
                            temporalAq: "ENABLED",
                            timecodeInsertion: "DISABLED"
                        }
                    },
                    height: 240,
                    name: "video_240p30",
                    respondToAfd: "NONE",
                    scalingBehavior: "STRETCH_TO_OUTPUT",
                    sharpness: 100,
                    width: 320
                }
            ]
        },
        inputAttachments: [
            {
                inputAttachmentName: MediaLiveInput.name,
                inputId: MediaLiveInput.ref,
                inputSettings: {
                    deblockFilter: "DISABLED",
                    denoiseFilter: "DISABLED",
                    filterStrength: 1,
                    inputFilter: "AUTO",
                    smpte2038DataPreference: "IGNORE",
                    sourceEndBehavior: "CONTINUE"
                }
            }
        ],
        inputSpecification: {
            codec: "AVC",
            maximumBitrate: "MAX_10_MBPS",
            resolution: "HD"
        },
        logLevel: "DISABLED",
        name: mediaId.valueAsString+"-LiveStream",
        roleArn: role.roleArn,
        tags: {
            
        }
    });
 
    new CfnOutput(this, 'PlaybackURL:', { value: 'https://'+CloudFrontDistribution.attrDomainName+'/'+MediaLiveInput.ref+'/index.m3u8'});
 
  }
}