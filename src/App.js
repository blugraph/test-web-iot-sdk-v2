import './App.css';
import Routes from './Routes/Routes';
import React from 'react';
import { withAuthenticator } from "aws-amplify-react";
import awsconfig from './aws-exports';
import Amplify from 'aws-amplify';
import { Auth } from '@aws-amplify/auth';

Amplify.configure(awsconfig);
Auth.configure(awsconfig);

function App() {
  return (
    <div className="App">
     <Routes />
    </div>
  );
}

export default withAuthenticator(App);
