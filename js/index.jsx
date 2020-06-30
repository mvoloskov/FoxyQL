import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';
import 'graphiql/graphiql.css';

// Buffer for endpoint entry value
let endpoint;

// Parse the search string to get url parameters.
const search = window.location.search;
let parameters = {};
search.substr(1).split('&').forEach(function (entry) {
    const eq = entry.indexOf('=');
    if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
            decodeURIComponent(entry.slice(eq + 1));
    }
});

// if variables was provided, try to format it.
if (parameters.variables) {
    try {
        parameters.variables =
            JSON.stringify(JSON.parse(parameters.variables), null, 2);
    } catch (e) {
        // Do nothing, we want to display the invalid JSON as a string, rather
        // than present an error.
    }
}

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared
function onEditQuery(newQuery) {
    parameters.query = newQuery;
    updateURL();
}

function onEditVariables(newVariables) {
    parameters.variables = newVariables;
    updateURL();
}

function updateURL() {
    let newSearch = '?' + Object.keys(parameters).map(function (key) {
        return encodeURIComponent(key) + '=' +
            encodeURIComponent(parameters[key]);
    }).join('&');
    history.replaceState(null, null, newSearch);
}

// Defines a GraphQL fetcher using the fetch API.
function graphQLFetcher(endpoint) {
    return function (graphQLParams) {
        return fetch(endpoint, {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(graphQLParams),
            credentials: 'include',
        }).then(response => response.json());
    }
}

class GraphiQLExtension extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            prevEndpoint: null,
            currEndpoint: this.props.endpoint,
        };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.setEndpoint = this.setEndpoint.bind(this);
        this.updateEndpoint = this.updateEndpoint.bind(this);
    }

    render() {
        const endpoint = this.state.currEndpoint;
        let graphqlConsole = null;
        if (endpoint) {
            graphqlConsole =
                <GraphiQL
                    id="graphiql"
                    fetcher={graphQLFetcher(endpoint)}
                    query={parameters.query}
                    variables={parameters.variables}
                    onEditQuery={onEditQuery}
                    onEditVariables={onEditVariables}/>;
        } else {
            graphqlConsole =
                <p id="no-endpoint">Set a non empty endpoint above</p>;
        }

        return (
            <div id="application">
                <div id="url-bar" className="graphiql-container">
                    <input type="text"
                           id="url-box"
                           defaultValue={endpoint}
                           onChange={this.updateEndpoint}
                           onKeyDown={this.handleKeyDown}/>
                    <a id="url-save-button" className="toolbar-button" onClick={this.setEndpoint}>
                        Set endpoint
                    </a>
                </div>
                {graphqlConsole}
            </div>
        );
    }

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.updateEndpoint(e);
            this.setEndpoint();
        }
    }

    setEndpoint() {
        const newEndpoint = endpoint;
        const setState = this.setState.bind(this);
        const currState = this.state;

        // If we have changed endpoints just now...
        if (endpoint !== currState.currEndpoint) {
            // then we shall re-execute the query after render
            setTimeout(() => {
                const buttons = document.getElementsByClassName('execute-button');
                for (const button of buttons) {//
                    button.click()
                }
            }, 500);
        }
        
        chrome.storage.local.set(
            {'endpoint': newEndpoint},
            () => {
                if (!chrome.runtime.lastError) {
                    // Move current endpoint to previous, and set current endpoint to new.
                    setState({
                        prevEndpoint: currState.currEndpoint,
                        currEndpoint: newEndpoint,
                    });
                }
            },
        );
    }

    updateEndpoint(e) {
        endpoint = e.target.value;
    }
}

chrome.storage.local.get('endpoint', (storage) =>
    // Render <GraphiQL /> into the container.
    ReactDOM.render(
        <GraphiQLExtension endpoint={storage.endpoint}/>,
        document.getElementById('react-container'),
    ),
);
