import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';
import 'graphiql/graphiql.css';

function GraphiQLExtension(props) {
    const [textValue, setTextValue] = useState(props.endpoint);
    const [currEndpoint, setCurrEndpoint] = useState(props.endpoint);

    const graphQLFetcher = (endpoint) => {
        return function (graphQLParams) {
            return fetch(endpoint, {
                method: 'post',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(graphQLParams),
                credentials: 'include',
            }).then(response => response.json());
        }
    }
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setEndpoint();
        }
    }

    const setEndpoint = () => {
        chrome.storage.local.set(
            {'endpoint': textValue},
            () => {
                if (!chrome.runtime.lastError) {
                    // Move current endpoint to previous, and set current endpoint to new.
                    setCurrEndpoint(textValue);
                }
            },
        );
    }

    const updateEndpoint = (e) => {
        setTextValue(e.target.value);
    }

    return (
      <div id="application">
        <div id="url-bar" className="graphiql-container">
          <input
            type="text"
            id="url-box"
            defaultValue={props.endpoint}
            onChange={updateEndpoint}
            onKeyDown={handleKeyDown}
          />
          <a id="url-save-button" className="toolbar-button" onClick={setEndpoint}>
            Set endpoint
          </a>
        </div>
        {currEndpoint ? (
          <GraphiQL
            id="graphiql"
            fetcher={graphQLFetcher(currEndpoint)}
          />
        ) : (
          <p id="no-endpoint">Set a non empty endpoint above</p>
        )}
      </div>
    );
}

chrome.storage.local.get('endpoint', (storage) =>
    // Render <GraphiQL /> into the container.
    ReactDOM.render(
        <GraphiQLExtension endpoint={storage.endpoint}/>,
        document.getElementById('react-container'),
    ),
);
