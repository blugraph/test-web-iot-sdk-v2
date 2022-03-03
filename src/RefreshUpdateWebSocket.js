import React, { useEffect, useState } from "react";
import Amplify from 'aws-amplify';
import awsConfig from './aws-exports';
import AWSIoTData from 'aws-iot-device-sdk';
import AWSConfiguration from './aws-iot-configuration';
import { Auth } from '@aws-amplify/auth';
import { decodeToken } from "react-jwt";
var mqttClient = null;

export default function RefreshUpdateWebSocket(props) {
    const [isConnected, setIsConnected] = useState(false);
    const [vehicleDetails, setVehicleDetails] = useState([]);
    const [message, setMessage] = useState();
    const [reconnect, setReconnect] = useState(0);
    const [credential, setCredentials] = useState();

    var clientId = 'bg-aws-app-iot-updateWebSocketCreds'; // + (Math.floor((Math.random() * 100000) + 1));
    
    useEffect(() => {
        initialize();
    }, [])


    async function initialize() {
        let credentials = await authCredentials();
        setCredentials(credentials);
        console.log('token_exp_time_initialize ', credentials.token_exp_time, ' current time ', Math.round((new Date()).getTime() / 1000));
        connectToMqttClient(credentials);
    }

    useEffect(() => {
        if (reconnect > 0) {
            const current_unix_time = Math.round((new Date()).getTime() / 1000);
            if (credential.token_exp_time < current_unix_time) {
                mqttClient.updateWebSocketCredentials(credential.essentialCredentials.AccessKeyId,
                    credential.essentialCredentials.SecretKey,
                    credential.essentialCredentials.SessionToken);
            } else {
                console.log('bg-aws-app-iot-tokens are still valid.');
            }
        }
    }, [reconnect])

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

    const connectToMqttClient = (creds) => {
        mqttClient = AWSIoTData.device({
            region: AWSConfiguration.region,
            host: AWSConfiguration.host,
            clientId: clientId,
            protocol: 'wss',
            maximumReconnectTimeMs: 8000,
            maximumReconnectTimeMs: 8000,
            accessKeyId: creds.essentialCredentials.accessKeyId,
            secretKey: creds.essentialCredentials.secretAccessKey,
            sessionToken: creds.essentialCredentials.sessionToken,
            debug: true,
            keepalive: parseInt(process.env.REACT_APP_AWS_MQTT_KEEPALIVE_SEC)
        });

        mqttClient.on('connect', function (err, callback) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-connect');
            setIsConnected(true); setReconnect(0);
            mqttClient.subscribe(process.env.REACT_APP_SUBSCRIBE);
        });
        mqttClient.on('message', function (topic, payload, packet) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-message   ', JSON.parse(`${payload.toString()}`));
            var newMessage = JSON.parse(`${payload.toString()}`);
            setMessage(newMessage);
            setVehicleDetails(state => [newMessage, ...state]);
        })

        mqttClient.on('close', function (err) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-close')
        });
        mqttClient.on('reconnect', function (callback) {
            console.log(new Date().toLocaleString() + ' bg-aws-app-iot-reconnect');
            setReconnect(rc => rc + 1);
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

    return (<>
        <h1>Refresh Update WebSocket Credentials</h1>
        {vehicleDetails && vehicleDetails.length > 0 && vehicleDetails.map((vehicle, index) => {
            return <h3 key={"vehicle " + index}>{vehicle.cpn}</h3>
        })}
    </>
    )
}