import React from 'react'
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import VideoChat from './VideoChat';
import DialogActions from '@material-ui/core/DialogActions';

function DialogVideoChat(props) {

  const { onClose, open, channelId, channelName, channelUrl } = props;
  
  const handleClose = () => {
    onClose(false);
  };
  
  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" maxWidth={"lg"} fullWidth={true}>
      <DialogTitle id="form-dialog-title">{ channelName }</DialogTitle>
      <DialogContent>
        <VideoChat channelId={channelId} channelName={channelName} channelUrl={channelUrl}/>
      </DialogContent>
      <DialogActions>
      </DialogActions>
    </Dialog>
  );
}

export default DialogVideoChat;