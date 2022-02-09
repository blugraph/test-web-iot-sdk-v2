const awsExports = {
    "Auth": {
        "identityPoolId": process.env.REACT_APP_IDENTITYPOOLID  , //'YOUR-IDENTITY-POOL-ID',
        "region": process.env.REACT_APP_REGION, //'YOUR-REGION',
        "userPoolId": process.env.REACT_APP_USERPOOLID,
        "userPoolWebClientId":process.env.REACT_APP_USERPOOLWEBCLIENTID 
    },
};

export default awsExports;