import React, { useEffect, useState } from "react";
import Amplify from 'aws-amplify';
import awsConfig from './aws-exports';
import AWSIoTData from 'aws-iot-device-sdk';
import AWSConfiguration from './aws-iot-configuration';
import { Auth } from '@aws-amplify/auth';
import { decodeToken } from "react-jwt";

export default function Demo2(props){
    const [isConnected, setIsConnected] = useState(false);
    const [vehicleDetails, setVehicleDetails] = useState([]);
    const [message, setMessage] = useState();
    const [credential, setCredentials] = useState();

    useEffect(() => {
        initialize();
    }, [])

    async function authCredentials() {
        // to get the tokens for cognito user 
        let currentSession = await Auth.currentSession();
        // Get accessKeyId,secretKeyId,identityId for AWS service authorization.
        var currentCredentials = await Auth.currentCredentials();
        // Get formatted AWS service access credentials to be passed to AWS services.
        var essentialCredentials = Auth.essentialCredentials(currentCredentials);
        let accessToken = currentSession && currentSession.accessToken && currentSession.accessToken.jwtToken
        let idToken = currentSession && currentSession.idToken && currentSession.idToken.jwtToken
        const myDecodedToken = decodeToken(accessToken);
        const token_exp_time = myDecodedToken.exp;
        return { essentialCredentials, accessToken, token_exp_time, currentSession, idToken }
    }

    async function initialize() {
        try {
            let credentials = await authCredentials();
            setCredentials(credentials);
            connectToMqttClient(credentials);
        }
        catch (err) {
            console.log("Cred Refresh Err: ", err);
        }
    }

    const connectToMqttClient = (creds) => {
        let clientId = 'bg-aws-app-iot-demo2'; // + (Math.floor((Math.random() * 100000) + 1));
        var mqttClient = AWSIoTData.device({
            region: AWSConfiguration.region,
            host: AWSConfiguration.host,
            clientId: clientId,
            protocol: 'wss',
            maximumReconnectTimeMs: 8000,
            accessKeyId: creds.essentialCredentials.accessKeyId,
            secretKey: creds.essentialCredentials.secretAccessKey,
            sessionToken: creds.essentialCredentials.sessionToken,
            debug: true,
            keepalive: parseInt(process.env.REACT_APP_AWS_MQTT_KEEPALIVE_SEC)
        });

        mqttClient.on('connect', function (err, callback) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-connect');
            // Where will connected be set to false?
            setIsConnected(true);
            mqttClient.subscribe(process.env.REACT_APP_SUBSCRIBE);
        });

        mqttClient.on('message', function (topic, payload, packet) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-message   ', JSON.parse(`${payload.toString()}`));
            var newMessage = JSON.parse(`${payload.toString()}`);
            setVehicleDetails(state => [newMessage, ...state]);
        })

        mqttClient.on('close', function (err) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-close')
            setIsConnected(false);
        });
        mqttClient.on('reconnect', function (callback) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-reconnect');
        });
        mqttClient.on('end', function () {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-end')
        });
        mqttClient.on('offline', function () {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-offline')
        });
        mqttClient.on('error', function (error) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-error')
        });
        mqttClient.on('packetsend', function (packet) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-packetsend')
        });
        mqttClient.on('packetreceive', function (packet) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-packetreceive')
        });
    }
    console.log('Message List ',vehicleDetails)
    return(
        <h6>Demo2</h6>
    )
}