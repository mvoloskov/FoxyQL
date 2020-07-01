import React, {useState, useEffect, useMemo} from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';
import useDebounce from './use-debounce';
import 'graphiql/graphiql.css';

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

function GraphiQLExtension(props) {
    const [endpoint, setEndpoint] = useState(props.endpoint);
    const [isTyping, setIsTyping] = useState(false);
    const debouncedEndpoint = useDebounce(endpoint, 500);

    // Store endpoint in local storage only after debounced
    useEffect(
        () => {
            setIsTyping(false);
            chrome.storage.local.set({
                endpoint: debouncedEndpoint,
            });
        },
        [debouncedEndpoint],
    );

    function changed(event) {
        setIsTyping(true);
        const newEndpoint = event.target.value;
        setEndpoint(newEndpoint);
    }

    // Only re-render GraphiQL when debounced endpoint actually changed, otherwise
    // it would re-render and fetch introspection queries too often
    const graphiQL = useMemo(() => {
        return debouncedEndpoint ? (
            <GraphiQL
                id="graphiql"
                fetcher={graphQLFetcher(debouncedEndpoint)}
            />
        ) : (
            <p id="no-endpoint">Set a non empty endpoint above</p>
        )

    }, [debouncedEndpoint]);

    return (
        <div id="application">
            <div id="url-bar" className="graphiql-container">
                <input
                    type="url"
                    id="url-box"
                    defaultValue={props.endpoint}
                    onChange={changed}
                />
                <div id="typing" style={isTyping ? {} : {visibility: 'hidden'}}>Typing ...</div>
            </div>
            {graphiQL}
        </div>
    );
}

chrome.storage.local.get('endpoint', (storage) =>
    // Render <GraphiQLExtension /> into the container.
    ReactDOM.render(
        <GraphiQLExtension endpoint={storage.endpoint}/>,
        document.getElementById('react-container'),
    ),
);
