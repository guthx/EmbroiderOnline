import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import { authService } from '../AuthService';

export default function CreateProject({ guid }) {
    const [isOpen, setIsOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [projectWarning, setProjectWarning] = useState("");
    const [created, setCreated] = useState(false);
    const [currentUser, setCurrentUser] = useState(authService.currentUserValue());

    useEffect(() => {
        let sub = authService.currentUser.subscribe(u => {
            setCurrentUser(u);
        });

        return () => sub.unsubscribe();
    }, [])

    const styles = (theme) => ({
        root: {
            margin: 0,
            padding: theme.spacing(2),
        },
        closeButton: {
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[500],
        },
    });

    const DialogTitle = withStyles(styles)((props) => {
        const { children, classes, onClose, ...other } = props;
        return (
            <MuiDialogTitle disableTypography className={'dialog-title'} {...other}>
                <Typography variant="h6">{children}</Typography>
                <IconButton aria-label="close" className={classes.closeButton} onClick={() => {
                    setIsOpen(false)
                    setProjectName('');
                    setCreated(false);
                    setProjectWarning('');
                }
                }>
                        <CloseIcon />
                    </IconButton>
            </MuiDialogTitle>
        );
    });

    const InfoTooltip = withStyles(() => ({
        tooltip: {
            backgroundColor: '#2e2e2e',
            color: 'white',
            borderRadius: '3px',
            fontSize: 14
        }
    }))(Tooltip);

    const createProject = () => {
        var headers = new Headers();
        authService.addAuthHeader(headers);
        headers.append('Content-Type', 'application/json');
        var body = {
            name: projectName,
            guid: guid
        }
        fetch('api/embroider/createProject', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        })
            .then(res => {
                if (res.ok)
                    setCreated(true);
                else
                    return res.text();
            })
            .then(text => {
                if (text)
                    setProjectWarning(text);
            })
            .catch(ex => { });
    }

    return (
        <>
            <InfoTooltip disableHoverListener={currentUser != null} title={'You have to be logged in to create a project'} placement="left" className={'tool-tip'}>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                disabled={currentUser == null}
                >Create project</button>
            </InfoTooltip>
        <Dialog className={'create-project-dialog'} open={isOpen}>
                <DialogTitle>
                    {
                        !created && 'Create a project'
                    }
                
            </DialogTitle>
                <div className={'dialog-content'}>
                    {
                        !created ? 
                            <>
                            <label for="project-name">
                                Project name
                    </label>
                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} />
                    {
                        projectWarning.length > 0 &&
                        <div className={'warning'}>
                            {projectWarning}
                        </div>
                    }
                                <button type="button" disabled={projectName.length < 3} onClick={() => {
                        createProject();
                    }}>Create project</button>
                            </>
                            :
                            <>
                            <div>
                                Project {projectName} successfully added to your account.
                            </div>
                                <div>
                                    You can access it via the 'Projects' option in the navigation bar
                                </div>
                            </>
                    }
                

            </div>
            </Dialog>
        </>
        );
}