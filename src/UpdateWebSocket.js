import React, { useEffect, useState } from "react";
import Amplify from 'aws-amplify';
import awsConfig from './aws-exports';
import AWSIoTData from 'aws-iot-device-sdk';
import AWSConfiguration from './aws-iot-configuration';
import { Auth } from '@aws-amplify/auth';
import { decodeToken } from "react-jwt";

export default function UpdateWebSocket(props) {
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
        var mqttClient = AWSIoTData.device({
            region: AWSConfiguration.region,
            host: AWSConfiguration.host,
            clientId: clientId,
            protocol: 'wss',
            maximumReconnectTimeMs: 8000,
            accessKeyId: '',
            secretKey: '',
            sessionToken: '',
            debug: true,
            keepalive: parseInt(process.env.REACT_APP_AWS_MQTT_KEEPALIVE_SEC)
        });
        mqttClientCallBacks(mqttClient);

        authCredentials().then(response => {
            mqttClient.updateWebSocketCredentials(response.essentialCredentials.AccessKeyId,
                response.essentialCredentials.SecretKey,
                response.essentialCredentials.SessionToken);
        })
    }


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

    const mqttClientCallBacks = (mqttClient) => {

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
        <h1>Update WebSocket Credentials</h1>
        {vehicleDetails && vehicleDetails.length > 0 && vehicleDetails.map((vehicle, index) => {
            return <h3 key={"vehicle " + index}>{vehicle.cpn}</h3>
        })}
    </>
    )
}