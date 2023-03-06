/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import React, { useEffect, useState } from "react";
//const iotsdk = require("aws-iot-device-sdk-v2");
//const iot = iotsdk.iot;
//const mqtt = iotsdk.mqtt;
import { mqtt, iot, auth } from "aws-iot-device-sdk-v2";
//const AWS = require("aws-sdk");
import * as AWS from "aws-sdk";
//const Settings = require("./settings");
//const $ = require("jquery");
import { Auth } from '@aws-amplify/auth';
import awsconfig from './aws-exports';
import Amplify from 'aws-amplify';

Amplify.configure(awsconfig);
Auth.configure(awsconfig);


export default function Demo3(props) {
    /*
    const [isConnected, setIsConnected] = useState(false);
    const [vehicleDetails, setVehicleDetails] = useState([]);
    const [message, setMessage] = useState();
    const [credential, setCredentials] = useState();
    */
    useEffect(() => {
        main();
    }, [])

    function log(msg) {
        //$("#console").append(`<pre>${msg}</pre>`);
        console.log(msg);
    }

    async function connect_websocket(essentialCredentials) {
        return new Promise((resolve, reject) => {
            /*
            let config =
                iot.AwsIotMqttConnectionConfigBuilder.new_default_builder()
                    .with_clean_session(true)
                    .with_client_id(`custom_authorizer_connect_sample(${new Date()})`)
                    .with_endpoint(Settings.AWS_IOT_ENDPOINT)
                    .with_custom_authorizer(
                        Settings.AWS_CUSTOM_AUTH_USERNAME == "Optional: <your username>" ? "" : Settings.AWS_CUSTOM_AUTH_USERNAME,
                        Settings.AWS_CUSTOM_AUTH_AUTHORIZER_NAME == "Optional: <your authorizer name>" ? "" : Settings.AWS_CUSTOM_AUTH_AUTHORIZER_NAME,
                        Settings.AWS_CUSTOM_AUTH_AUTHORIZER_PASSWORD == "Optional: <your authorizer password>" ? "" : Settings.AWS_CUSTOM_AUTH_AUTHORIZER_PASSWORD,
                        Settings.AWS_CUSTOM_AUTH_PASSWORD == "Optional: <your password>" ? "" : Settings.AWS_CUSTOM_AUTH_PASSWORD,
                    )
                    .with_keep_alive_seconds(30)
                    .build();
            */
           /*
            let config = 
                iot.AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket()
                    .with_clean_session(true)
                    .with_client_id(`pub_sub_sample(${new Date()})`)
                    .with_endpoint(Settings.AWS_IOT_ENDPOINT)
                    .with_credential_provider(provider)
                    .with_use_websockets()
                    .with_keep_alive_seconds(30)
                    .build();
            */
            let config = 
                iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets()
                    .with_clean_session(false)
                    .with_client_id("clientId")
                    .with_endpoint(process.env.REACT_APP_IOT_ENDPOINT)
                    .with_keep_alive_seconds(30)
                    .with_credentials(
                        process.env.REACT_APP_REGION,
                        essentialCredentials.accessKeyId,
                        essentialCredentials.secretAccessKey,
                        essentialCredentials.sessionToken
                    )
                    .build();
            

            log("Connecting custom authorizer...");
            const client = new mqtt.MqttClient();

            const connection = client.new_connection(config);
            connection.on("connect", (session_present) => {
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
            connection.connect();
        });
    }

    async function main() {
        let currentCredentials = await Auth.currentCredentials();
        var essentialCredentials = Auth.essentialCredentials(currentCredentials);
        connect_websocket(essentialCredentials)
            .then((connection) => {
                connection.subscribe(
                    process.env.REACT_APP_SUBSCRIBE, mqtt.QoS.AtLeastOnce,
                    (topic, payload, dup, qos, retain) => {
                        const decoder = new TextDecoder("utf8");
                        let message = decoder.decode(new Uint8Array(payload));
                        log(`Message received: topic=\"${topic}\" message=\"${message}\"`);
                        //connection.disconnect();
                    })
                    /*
                    .then((subscription) => {
                        return connection.publish(subscription.topic, "Hello World!", subscription.qos);
                    });
                    */
            })
            .catch((reason) => {
                log(`Error while connecting: ${reason}`);
            });
    }

    return (
        <h6>Demo3</h6>
    )
}
