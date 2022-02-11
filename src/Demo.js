import React, { useEffect } from "react";
import { Auth } from '@aws-amplify/auth';
import { mqtt, iot } from 'aws-crt/dist.browser/browser';
import awsconfig from './aws-exports';
import Amplify from 'aws-amplify';

Amplify.configure(awsconfig);
Auth.configure(awsconfig);

export default function Demo(props) {

    useEffect(() => {
        main();
    }, [])

    async function main(argv) {
        let currentCredentials = await Auth.currentCredentials();
        var essentialCredentials = await Auth.essentialCredentials(currentCredentials);
        const connection = build_websocket_mqtt_connection_from_args(essentialCredentials);
        // const timer = setInterval(() => { }, 60 * 1000);

        connection.on('connect', function () {
            console.log('connect')
        });
        connection.on('error', function () {
            console.log('error')
        });
        connection.on('message', function () {
            console.log('message')
        });
        connection.on('offline', function () {
            console.log('offline')
        });
        connection.on('end', function () {
            console.log('end')
        });
        await connection.connect();
        await execute_session(connection, argv);

        // await connection.disconnect();

        // Allow node to die if the promise above resolved
        // clearTimeout(timer);
    }

    /* Build an mqtt connection using websockets, (http) proxy optional.*/
    function build_websocket_mqtt_connection_from_args(argv) {
        let config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets();
        let clientId = "test-" + Math.floor(Math.random() * 100000000);
        config_builder.with_clean_session(false);
        config_builder.with_client_id(clientId);
        config_builder.with_endpoint(process.env.REACT_APP_IOT_ENDPOINT);
        config_builder.with_keep_alive_seconds(30);
        config_builder.with_credentials(
            process.env.REACT_APP_REGION,
            argv.accessKeyId,
            argv.secretAccessKey,
            argv.sessionToken
        )
        const config = config_builder.build();

        const client = new mqtt.MqttClient();
        return client.new_connection(config);
    }

    async function execute_session(connection, argv) {
        return new Promise(async (resolve, reject) => {
            try {
                const decoder = new TextDecoder('utf8');
                const on_publish = async (topic, payload, dup, qos, retain) => {
                    const json = decoder.decode(payload);
                    console.log(`Publish received. topic:"${topic}" dup:${dup} qos:${qos} retain:${retain}`);
                    console.log(json);
                    const message = JSON.parse(json);
                    console.log('message', message)
                }

                await connection.subscribe(process.env.REACT_APP_SUBSCRIBE, mqtt.QoS.AtLeastOnce, on_publish);

            }
            catch (error) {
                reject(error);
            }
        });
    }

    return (
        <h6>Demo</h6>
    )
}