/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable react/jsx-pascal-case */
import React from "react";
import { BrowserRouter as Router,Switch,Route} from "react-router-dom";
import { createBrowserHistory } from "history";
import Demo from "../Demo";

import Amplify from 'aws-amplify';
import { Auth } from '@aws-amplify/auth';

import awsconfig from '../aws-exports';
Amplify.configure(awsconfig);

// >>New - Configuring Auth Module
Auth.configure(awsconfig);

const history = createBrowserHistory();
export default function Routes(props) {
  return (
    <Router history={history} basename="/" forceRefresh={true}> 
      <Switch>
            <Route exact path="/"><Home  {...props} /></Route>
            <Route exact path="/demo">< Demo {...props} /></Route>

      </Switch>
    </Router>
  );
}

function Home(props){
    return(
        <h1 className="h3 mb-2 text-gray-800" style={{ textAlign: "left", paddingLeft: "10px", fontSize: "20px" }}>Dashboard</h1>
    )
}