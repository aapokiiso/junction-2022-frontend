import React, {useEffect, useState} from 'react'
import Draggable from 'react-draggable';
import Map from '../components/Map'
import {fetchNodes, fetchEdges, updateDeltaTForBuilding, fetchFinalTemperature} from '../utils/api'
import Head from 'next/head'
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import RangeSlider from 'react-bootstrap-range-slider';


export default function Index() {
  const [nodes, setNodes] = useState(null);
  const [edges, setEdges] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeName, setNodeName] = useState(null);
  const [deltaTValue, setDeltaTValue] = useState('');
  const [finalTemperature, setFinalTemperature] = useState(null)
  const [deltaTLog, setDeltaTLog] = useState([])

  const COST_COMBINED = (nodes ? nodes.filter(({type}) => type === 'consumer').length : 0)*10000;
  const ENERGY_SAVINGS = Math.round(35300*55/finalTemperature);
  const REDUCED_EMIS = Math.round(0.336*ENERGY_SAVINGS);
  const MONEY_SAVINGS = Math.round(0.4*ENERGY_SAVINGS);
  const TIME_TO_ROI = Math.round(COST_COMBINED / MONEY_SAVINGS);

  const refreshData = () => {
    fetchNodes()
      .then(nodes => {
        setNodes(nodes)
      })

    fetchEdges()
      .then(edges => {
        setEdges(edges)
      })

    fetchFinalTemperature()
      .then(temperature => {
        if (finalTemperature) {
        setDeltaTLog(oldArray => [...oldArray, [selectedNodeName,deltaTValue,Math.round((finalTemperature-temperature)*100,2)/100]])
        }
        setFinalTemperature(temperature)
      })
  }

  const handleNodeSelect = (nodeId) => {
    setSelectedNodeId(nodeId)
  }

  const handleDeltaTChange = (event) => {
    setDeltaTValue(parseInt(event.target.value,10))
  }

  let prevSystemTemp
  const handleFormSubmit = async (event) => {
    console.log(deltaTValue)
    prevSystemTemp = finalTemperature;
    updateDeltaTForBuilding(selectedNodeId, deltaTValue).then(
      ()=> {
        refreshData()
      }
    )
    event.preventDefault();
  }

  useEffect(() => {
    if (selectedNodeId) {
      console.log("click building")
      let currentNode = nodes.find(x => x.id==selectedNodeId);
      setNodeName(currentNode.name);
      setDeltaTValue(currentNode.deltaT);
      // TODO: open editor
    }
  }, [selectedNodeId]);

  useEffect(() => {
    refreshData()
  }, [])

  const MyComponent = () => {
    const [ value ] = useState(0); 
    return (
      <RangeSlider
        value={deltaTValue}
        onChange={changeEvent => setDeltaTValue(changeEvent.target.value)}
      />
    );
  };

  return (
    <div className="App">
      <div>
        <Head>
          <title>District Heating Dashboard</title>
          <meta charSet="utf-8" />
          <link rel="shortcut icon" href="/static/favicon.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#000000" />
          <meta
            name="description"
            content="Advanced Dashboard for analysing district heating"
          />
        </Head>
      </div>

      <header className="App-header">
        <img src="/static/logo1dark.svg" alt="Logo 1 Dark" className="logo"></img>
        <h1 className="logo">Advanced District Heating Dashboard</h1>
      </header>

      <div className="App-body">
        <div className="row">
          <div className="column-left">
            <div id="building-parameters" style={{"display": selectedNodeId ? "block" : "none"}}>
              <h2>Set temperature change for {selectedNodeName} -circuit</h2>
              <form onSubmit={handleFormSubmit} className = "DeltaTSetter">
                <MyComponent></MyComponent>
                <p>{deltaTValue}</p>
                <input type="submit" value="Log value" onclick={handleDeltaTChange}></input>
              </form>
            </div>
            <div>
              <h2>Delta T changelog</h2>
              <ol style={{"textAlign": "left", "margin": "0px 10px 0px 30px"}}>
              {deltaTLog.map((event) => (
                <li>{event[0]} uses {event[1]}°C effectively<span style={{float: "right", color: (event[2]>0 ? "green" : "red")}}>{event[2]} °C</span></li>
              ))}
              </ol>
            </div>
          </div>
          <div className="column-right">
            {nodes && edges && finalTemperature !== null && <div className="mapContainer">
              <Map
                nodes={nodes}
                edges={edges}
                selectedNodeId={selectedNodeId}
                finalTemperature={finalTemperature}
                handleNodeSelect={handleNodeSelect}
              />
            </div>}
            <Draggable bounds="body">
              <div className="stats">
                <h3>Grid Statistics</h3>
                <table>
                  <tbody>
                    <tr>
                      <td>Total investment cost:</td>
                      <td></td>
                      <td>{COST_COMBINED} €</td>
                    </tr>
                    <tr>
                      <td>Total energy conservation:</td>
                      <td></td>
                      <td>{ENERGY_SAVINGS} MWh / year</td>
                    </tr>
                    <tr>
                      <td>CO² emissions reduced by:</td>
                      <td> </td>
                      <td>{REDUCED_EMIS} tons / year</td>
                    </tr>
                    <tr>
                      <td>Reduction in operating costs:</td>
                      <td></td>
                      <td>{MONEY_SAVINGS} € / year</td>
                    </tr>
                    <tr>
                      <td>Return on investment at:</td>
                      <td></td>
                      <td>{TIME_TO_ROI} years</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Draggable>
          </div>
        </div>
      </div>

      <footer className="App-footer">
        <p>
          Application created by Junkkaritiimi ADHD.
        </p>
      </footer>
    </div>
  );
}
