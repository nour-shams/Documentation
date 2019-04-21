import React, { Component } from 'react';
import io from 'socket.io-client';

class App extends Component {

  state = {
    isConnected:false,
    id:null,
    users:[],
    text:''
  }
  socket = null

  componentDidMount(){

    this.socket = io('http://localhost:8000');

    this.socket.on('log', stuff => console.warn('LOG',stuff))

    this.socket.on('connect', () => {
      this.setState({isConnected:true})
    })

    this.socket.on('disconnect', () => {
      this.setState({isConnected:false})
    })

    this.socket.on('pong!',(additionalStuff)=>{
      console.log('server answered!', additionalStuff)
    })

    this.socket.on('youare',(answer)=>{
      this.setState({id:answer.id})
    })

    this.socket.on('room_message',message => {
      console.log(message)
    })

    this.socket.on('room', old_messages => console.log(old_messages))

    this.socket.on('peeps',(peeps)=>this.setState({users:peeps}))
    this.socket.on('next',(text)=>console.log(text))
  }

  componentWillUnmount(){
    this.socket.close()
    this.socket = null
  }

  onInputChange = (evt) => {
    this.setState({text:evt.target.value})
  }

  onAnswerPress = () => {
    this.socket.emit('answer', this.state.text)
  }

  onTestChatPress = () => {
    const {text} = this.state
    this.socket.emit('message', text)
    this.setState({ text:'' })
  }

  onSendChatPress = () => {
    const { text, id } = this.state
    const name = 'jad'
    const message = ({ text, id, name })
    this.socket.emit('message', message)
    this.setState({ text:'' })
  }

  render() {
    return (
      <div className="App">
        <div>status: {this.state.isConnected ? 'connected' : 'disconnected'}</div>
        <div>id: {this.state.id}</div>
        <button onClick={()=>this.socket.emit('ping!')}>ping</button>
        <button onClick={()=>this.socket.emit('whoami')}>Who am I?</button>
        <button onClick={()=>this.socket.emit('give me next')}>next</button>
        <button onClick={()=>this.socket.emit('addition')}>equation</button>
        <button onClick={()=>this.socket.emit('hint')}>hint</button>
        <button onClick={()=>this.socket.emit('hint:addition')}>hint:addition</button>
        <br/>
        <input onChange={this.onInputChange} value={this.state.text}/>
        <button onClick={this.onAnswerPress}>answer</button>
        <button onClick={this.onTestChatPress}>test chat</button>
        <button onClick={this.onSendChatPress}>send chat</button>
        <ul>
          { this.state.users.map(u=><li key={u}>{u}</li>)}
        </ul>
      </div>
    );
  }
}

export default App;
