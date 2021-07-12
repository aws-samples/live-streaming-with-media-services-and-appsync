import React from 'react'
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import SendIcon from '@material-ui/icons/Send';
import IconButton from '@material-ui/core/IconButton';
import {Card, CardActions, CardContent,List, ListItem, Input} from '@material-ui/core';
import { Auth, API, graphqlOperation } from 'aws-amplify';
import { createMessage } from '../graphql/mutations';
import { onCreateMessage } from '../graphql/subscriptions';
import { listMessagesByChannel } from '../graphql/queries';
import Chip from '@material-ui/core/Chip';
import VideoPlayer from './VideoPlayer';

const useStyles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  item: {
    padding: theme.spacing(1,0,0,0)
  },
  top: {
    textAlign: 'left',
    padding: theme.spacing(0,0,1,0)
  }
});

class VideoChat extends React.Component {
  
  constructor(props){
    super(props);
    this.state = {
      tmpMessage: "",
      messages: [],
      username: "",
      channelId: props.channelId,
      videoJsOptions: {
        autoplay: true,
        controls: true,
        sources: [
          {
            src: props.channelUrl,
            type: 'application/x-mpegURL',
          },
        ],
      }
    };
  }
  
  scrollToBottom = () => {
    const chat = document.getElementById("chatMessages");
    chat.scrollTop = chat.scrollHeight;
  };
  
  async componentDidMount() {
    const data = await Auth.currentAuthenticatedUser();
    this.setState({ username: data.username });
    
    const result = await API.graphql(graphqlOperation(listMessagesByChannel, { channelId: this.state.channelId, sortDirection:'ASC' } ));
    this.setState({ messages: result.data.listMessagesByChannel.items });
    
    this.createMessageListener = API.graphql(graphqlOperation(onCreateMessage, { channelId: this.state.channelId })).subscribe({
      next:  messageData => {
        const newMessage = messageData.value.data.onCreateMessage;
        if (newMessage.username!==this.state.username){
          this.setState({ messages: [...this.state.messages, newMessage ] })
          this.scrollToBottom();
        }
      }
    });
    
    this.scrollToBottom();
  }
  
  componentWillUnmount() {
    console.log("Removed.....");
    this.createMessageListener.unsubscribe();
  }
  
  publishMessage = async event => {
    const input = {
      channelId: this.state.channelId,
      username: this.state.username,
      content: this.state.tmpMessage,
    }
    this.setState({ messages: [...this.state.messages, input ] })
    this.setState({ tmpMessage: "" })
    await API.graphql(graphqlOperation(createMessage, { input } ));
    this.scrollToBottom();
  };
  
  handleKeyDown = (event) => {
    if(event.target.id === "messageInput"){
      if (event.key === 'Enter') {
        this.publishMessage();
      }
    }
  };
  
  handleChangeInput = (event) => {
    this.setState({ tmpMessage: event.target.value })
  };
  
  render() {
    const { classes } = this.props;
    
    return (
    <div className="App">
      <CssBaseline />
      <Grid container spacing={3}>
        <Grid item sm={12} md={8}>
            
          <div data-vjs-player>
            <VideoPlayer {...this.state.videoJsOptions} />
          </div>
            
        </Grid>
        <Grid item sm={12} md={4}>
          
            <Card >
                <CardContent>
                  <div className={classes.top}>
                    <Typography variant="h5" color="primary" inline >Chat</Typography>
                  </div>
                  <List id="chatMessages" style={{height: 320, overflow: 'auto'}} >
                    { this.state.messages.map((item, index)=>(
                      <ListItem className={classes.item} key={index}>
                        <Chip label={ item.username+" : "+item.content} color={ this.state.username===item.username ? "secondary" : "primary" } />
                      </ListItem>
                    ))}
                  </List>
                  
                </CardContent>
                <CardActions>
                  <Input
                    placeholder="Enter a message"
                    fullWidth={true}
                    id="messageInput"
                    value={this.state.tmpMessage}
                    onChange={this.handleChangeInput}
                    onKeyDown={this.handleKeyDown}
                    inputProps={{'aria-label': 'Message Field',}}
                    autoFocus={true}
                  />
                  <IconButton
                    color="primary"
                    onClick={this.publishMessage}
                    >
                    <SendIcon />
                  </IconButton>
                </CardActions>
              </Card>

        </Grid>
      </Grid>
    </div>
    );
  }
}

export default withStyles(useStyles)(VideoChat);