/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import React, { useEffect } from "react";
import AWSConfiguration from './aws-iot-configuration';
import { mqtt, iot, auth } from "aws-iot-device-sdk-v2";
//import * as AWS from "aws-sdk";
import { Auth } from '@aws-amplify/auth';
import awsconfig from './aws-exports';
import Amplify from 'aws-amplify';

Amplify.configure(awsconfig);
Auth.configure(awsconfig);

class AWSCognitoCredentialsProvider {
    constructor(options, expire_interval_in_ms) {
        this.options = options;
        Auth.currentCredentials().then((currentCredentials) => {
            console.log(currentCredentials)
            this.aws_credentials =
            {
                aws_region: options.Region,
                aws_access_id: currentCredentials.accessKeyId,
                aws_secret_key: currentCredentials.secretAccessKey,
                aws_sts_token: currentCredentials.sessionToken
            }

        
        }).catch((err) => {
            console.log(err);
        });

        setInterval(() => {
            this.refreshCredentialAsync();
        }, expire_interval_in_ms || 3600 * 1000);

    }

    getCredentials() {
        return this.aws_credentials;
    }

    async refreshCredentialAsync() {
        return new Promise((resolve, reject) => {
                Auth.currentCredentials().then((currentCredentials) => {
                    console.log(currentCredentials)
                    this.aws_credentials =
                    {
                        aws_region: this.aws_credentials.aws_region,
                        aws_access_id: currentCredentials.accessKeyId,
                        aws_secret_key: currentCredentials.secretAccessKey,
                        aws_sts_token: currentCredentials.sessionToken
                    }
                    resolve(this);
                }).catch((err) => {
                reject(err)
            });
        })
    }
}


export default function Demo4(props) {
    useEffect(() => {
        main();
    }, [])
    
    function log(msg) {
        console.log(msg);
    }

    async function connect_websocket(provider) {
        return new Promise((resolve, reject) => {
            let config = iot.AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket()
                .with_clean_session(true)
                .with_client_id(`pub_sub_sample(${new Date()})`)
                .with_endpoint(AWSConfiguration.endpoint_raw)
                .with_credential_provider(provider)
                .with_use_websockets()
                .with_keep_alive_seconds(30)
                .build();

            log("Connecting websocket...");
            const client = new mqtt.MqttClient();

            const connection = client.new_connection(config);
            connection.on("connect", (session_present) => {
                log('Connected');
                resolve(connection);
            });
            connection.on("interrupt", (error) => {
                log(`Connection interrupted: error=${error}`);
            });
            connection.on("resume", (return_code, session_present) => {
                log(`Resumed: rc: ${return_code} existing session: ${session_present}`);
            });
            connection.on("disconnect", () => {
                log("Disconnected");
            });
            connection.on("error", (error) => {
                reject(error);
            });
            log('Connecting');
            connection.connect();
        });
    }

    async function main() {
        const provider = new AWSCognitoCredentialsProvider({
            //IdentityPoolId: awsconfig.aws_cognito_identity_pool_id,
            //Region: awsconfig.aws_cognito_region
            IdentityPoolId: awsconfig.Auth.identityPoolId,
            Region: awsconfig.Auth.region
        });
        log('Main');
        provider.refreshCredentialAsync().then((v) => {
            console.log(v);
            connect_websocket(provider)
                .then((connection) => {
                    connection
                        .subscribe(
                            process.env.REACT_APP_SUBSCRIBE,
                            mqtt.QoS.AtLeastOnce,
                            (topic, payload, dup, qos, retain) => {
                                const decoder = new TextDecoder("utf8");
                                let message = decoder.decode(new Uint8Array(payload));
                                log(`Message received: topic=${topic} message=${message}`);
                                /** The sample is used to demo long-running web service. 
                                 * Uncomment the following line to see how disconnect behaves.*/
                                // connection.disconnect();
                            }
                        )
                        /*
                        .then((subscription) => {
                            log(`start publish`)
                            let msg_count = 0;
                            connection.publish(subscription.topic, `NOTICE ME {${msg_count}}`, subscription.qos);
                            // The sample is used to demo long-running web service. The sample will keep publishing the message every minute.
                            setInterval(() => {
                                msg_count++;
                                const msg = `NOTICE ME {${msg_count}}`;
                                connection.publish(subscription.topic, msg, subscription.qos);
                            }, 60000);
                        });
                        */
                })
                .catch((reason) => {
                    log(`Error while connecting: ${reason}`);
                });
        }, (reason) => { console.log(reason); });
    }

    return (
        <h6>Demo4</h6>
    )

}
