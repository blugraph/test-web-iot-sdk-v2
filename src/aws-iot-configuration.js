const awsIotConfiguration = {
  endpoint: process.env.REACT_APP_IOT_ENDPOINT+'/mqtt' ,//'wss://<ATS-endpoint>/mqtt',
  endpoint_raw: process.env.REACT_APP_IOT_ENDPOINT,//'wss://<ATS-endpoint>/mqtt',
  region: process.env.REACT_APP_REGION,//'us-east-1',
  poolId: process.env.REACT_APP_IDENTITYPOOLID ,//'<Cognito-identity-pool-id>',
  host: process.env.REACT_APP_IOT_ENDPOINT,//'<ATS-endpoint>'
  policyName:process.env.REACT_APP_POLICYNAME
};
export default awsIotConfiguration;