import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  state = { contacts_list:[] }
  async componentDidMount(){
    try{
      const response = await fetch('//localhost:8080/contacts/list')
      const data = await response.json()
      this.setState({contacts_list:data})
    }catch(err){
      console.log(err)
    }
  }
  render() {
    const { contacts_list } = this.state
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          { contacts_list.map( contact => 
                <div key={contact.id}>
                  <p>{contact.id} -  {contact.name}</p>
                </div>
            )
          }
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
