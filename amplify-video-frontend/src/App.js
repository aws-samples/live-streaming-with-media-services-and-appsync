import React from 'react'
import { withAuthenticator } from '@aws-amplify/ui-react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import VideocamIcon from '@material-ui/icons/Videocam';
import Container from '@material-ui/core/Container';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import Divider from '@material-ui/core/Divider';

import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';

import { API, graphqlOperation } from 'aws-amplify';
import { Auth } from 'aws-amplify';
import { createChannel, updateChannel, deleteChannel } from './graphql/mutations';
import { listChannels } from './graphql/queries';
import { onCreateChannel, onUpdateChannel, onDeleteChannel } from './graphql/subscriptions';

import DialogVideoChat from './components/DialogVideoChat';

const useStyles = theme => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  myContent: {
    padding: theme.spacing(2, 2, 2),
  },
  grow: {
    flexGrow: 1,
  },
  margin: {
    margin: theme.spacing(1),
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
  actionButtons: {
    '& > *': {
      margin: theme.spacing(1),
    },
  }
});

class App extends React.Component {
  
  constructor(props){
    super(props);
    this.state = {
      openAddEdit: false,
      openVideoChat: false,
      channelId: "",
      channelName: "",
      channelUrl: "",
      channels: []
    };
  }
  
  async componentDidMount() {
    const result = await API.graphql(graphqlOperation(listChannels, { }));
    console.log(result.data.listChannels.items);
    this.setState({ channels: result.data.listChannels.items });
    
    this.createChannelListener = API.graphql(graphqlOperation(onCreateChannel)).subscribe({ 
      next:  channelData => {
        const newChannel = channelData.value.data.onCreateChannel;
        const prevChannels = this.state.channels.filter(
          channel => channel.id !== newChannel.id
          );
        const updatedChannels = [newChannel, ...prevChannels];
        this.setState({ channels: updatedChannels });
      }
    });
    
    this.deleteChannelListener = API.graphql(graphqlOperation(onDeleteChannel)).subscribe({
      next: channelData => {
        const deletedChannel = channelData.value.data.onDeleteChannel;
        const updatedChannels = this.state.channels.filter(channel => channel.id !== deletedChannel.id);
        this.setState({ channels: updatedChannels});
      }
    });
    
    this.updateChannelListener = API.graphql(graphqlOperation(onUpdateChannel)).subscribe({
      next : channelData => {
        const {channels} = this.state;
        const updatedChannel = channelData.value.data.onUpdateChannel;
        const index = channels.findIndex(channel => channel.id === updatedChannel.id);
        const updatedChannels = [
          ...channels.slice(0, index),
          updatedChannel,
          ...channels.slice(index+1)
        ];
        this.setState({channels: updatedChannels});
      }
    });
    
  }
  
  componentWillUnmount() {
    this.createChannelListener.unsubscribe();
    this.deleteChannelListener.unsubscribe();
    this.updateChannelListener.unsubscribe();
  }
  
  onClickSignout = async event => {
    try {
        await Auth.signOut();
        window.location.reload(false);
    } catch (error) {
        console.log('error signing out: ', error);
    }
  }
  
  handleClickOpenAdd = () => {
    this.setState({ openAddEdit: true });
  };

  handleCloseAddEdit = () => {
    this.setState({ openAddEdit: false });
    this.clearData();
  };
  
  handleChangeChannelName = event => {
    this.setState({ channelName: event.target.value });
  }
  
  handleChangeChannelUrl = event => {
    this.setState({ channelUrl: event.target.value });
  }
  
  handleUpdateSave = async event => {
    if (this.state.channelId){
      const input = {
        id: this.state.channelId,
        name: this.state.channelName,
        url: this.state.channelUrl
      }
      await API.graphql(graphqlOperation(updateChannel,{ input }));       
    }else{
      const input = {
        name: this.state.channelName,
        url: this.state.channelUrl
      }
      await API.graphql(graphqlOperation(createChannel,{ input })); 
    }
    this.clearData();
    this.setState({ openAddEdit: false });
  }
  
  clearData = () => {
    this.setState({ channelName: "", channelUrl: "", channelId: "" });
  }
  
  handleDeleteChannel = async channelId => {
    const input = { id: channelId };
    await API.graphql(graphqlOperation(deleteChannel, { input }));
  }

  handleClickChannel = async item => {
    this.setState({ channelId: item.id, channelName: item.name, channelUrl: item.url, openVideoChat: true });
  }
  
  handleEditChannel = async item => {
    this.setState({ channelId: item.id, channelName: item.name, channelUrl: item.url, openAddEdit: true });
  }
  
  handleCloseVideoChat = event => {
    this.setState({ openVideoChat: false });
    this.clearData();
  };
  
  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
              <VideocamIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Video Streaming
            </Typography>
            <Button color="inherit" onClick={this.onClickSignout}>Sign out</Button>
          </Toolbar>
        </AppBar>
        
        <Container className={classes.myContent}>
        
          <Toolbar>
            <Typography variant="h5" component="h1" gutterBottom>
                Channels
            </Typography>
            <div className={classes.grow} />
            <Button variant="contained" color="secondary" className={classes.margin} onClick={this.handleClickOpenAdd}>
              <AddIcon className={classes.extendedIcon} />
              Add Channel
            </Button>
          </Toolbar>
        
          
          <Grid item xs={12} md={12}>
            <div className={classes.demo}>
              <List dense={false}>
                { this.state.channels.map(item => (
                  <div key={item.id}>
                    <ListItem button onClick={() => this.handleClickChannel(item)} >
                      <ListItemAvatar>
                        <Avatar>
                          <VideocamIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.name}
                      />
                      <ListItemSecondaryAction className={classes.actionButtons}>
                        <IconButton edge="end" aria-label="delete" onClick={() => this.handleEditChannel(item)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => this.handleDeleteChannel(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </div>
                )) }
              </List>
            </div>
          </Grid>
        
        </Container>
        
        
        <Dialog disableBackdropClick disableEscapeKeyDown open={this.state.openAddEdit} onClose={this.handleCloseAddEdit} aria-labelledby="form-dialog-title">
          <DialogTitle id="form-dialog-title">{ this.state.channelId ? "Edit Channel" : "Add Channel" }</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Specify the channel name and your playback url (m3u8 link) from your media services.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="channelName"
              label="Channel Name"
              type="text"
              onChange={this.handleChangeChannelName} value={this.state.channelName}
              fullWidth
            />
            <TextField
              margin="dense"
              id="channelUrl"
              label="Playback URL"
              type="text"
              onChange={this.handleChangeChannelUrl} value={this.state.channelUrl}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCloseAddEdit} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleUpdateSave} color="primary">
              { this.state.channelId ? "Update" : "Save" }
            </Button>
          </DialogActions>
        </Dialog>
        
        <DialogVideoChat channelId={this.state.channelId} channelName={this.state.channelName} channelUrl={this.state.channelUrl} open={this.state.openVideoChat} onClose={this.handleCloseVideoChat} />
        
      </div>
    );
  }
}

export default withAuthenticator(withStyles(useStyles)(App));