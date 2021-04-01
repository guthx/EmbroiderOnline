import React, { useState } from 'react'
import { useEffect } from 'react';
import { authService } from '../AuthService';
import { Link } from 'react-router-dom';
import './ProjectList.css';
import { Icon } from '@iconify/react';
import warningStandardSolid from '@iconify-icons/clarity/warning-standard-solid';
import trashSolid from '@iconify-icons/clarity/trash-solid';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import Spinner from './Spinner';


export default function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [currentUser, setCurrentUser] = useState(authService.currentUserValue());
    const [deletedProject, setDeletedProject] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let sub = authService.currentUser.subscribe(u => {
            setCurrentUser(u);
        });

        return () => sub.unsubscribe();
    }, [])

    useEffect(() => {
        if (currentUser) {
            var headers = new Headers();
            authService.addAuthHeader(headers);

            fetch('api/project', {
                headers: headers
            })
                .then(res => res.json())
                .then(projects => {
                    setProjects(projects);
                    setLoading(false);
                })
                .catch(ex => { });
        }
    }, [currentUser]);

    function deleteProject(name) {
        setDeleting(true);
        var headers = new Headers();
        authService.addAuthHeader(headers);

        fetch('api/project/' + name, {
            method: 'DELETE',
            headers: headers
        })
            .then(res => {
                if (res.status == 200) {
                    setProjects(projects.filter(p => p.name != name));
                }
                setDeletedProject(null);
                setDeleting(false);
            });
    }

    const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }

    const List = () => {
        return projects.map((project, i) => {
            const imageBlob = new Blob([b64toBlob(project.previewImage)], { type: 'image/jpeg' });
            const url = URL.createObjectURL(imageBlob);
            return (
                <div className={'project-entry'}>
                    <Link to={'/project/' + project.name}>
                        <div
                            key={i}
                            className={'project'}
                        >
                            <div className={'project-preview'}>
                                <img src={url} />
                            </div>
                            <div className={'project-info'}>
                                <h3 className={'project-name'}>
                                    {project.name}
                                </h3>
                                <div>
                                    Progress: ({project.finishedStitches}/{project.totalStitches})
                        </div>
                                <div className={'progress-bar'}>
                                    <div className={'progress-bar-text'}>
                                        {Math.round((project.finishedStitches / project.totalStitches) * 100)}%
                            </div>
                                    <div className={'progress-bar-fill'}
                                        style={
                                            { width: `${(project.finishedStitches / project.totalStitches) * 100}%` }
                                        }>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                    <div
                        className={'delete-button'}
                        onClick={() => setDeletedProject(project.name)} >
                        <Icon icon={trashSolid} />
                    </div>
                </div>
            );
        });
    }

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
                    setDeletedProject(null);
                }
                }>
                    <CloseIcon />
                </IconButton>
            </MuiDialogTitle>
        );
    });

    if (!currentUser)
        return (
            <div className={'warning-screen'}>
                <Icon icon={warningStandardSolid} />
                You need to be logged in to access your projects
            </div>
        );
    if (loading)
        return (
            <div className={'warning-screen'}>
                <Spinner />
            </div>
        );
    if (projects.length == 0)
        return (
            <div className={'warning-screen'}>
                You don't have any projects yet.<br/>
                Return to home-page, upload an image and create your first project!
            </div>
            );

    return (
        <>
            <Dialog className={'delete-project-dialog'} open={deletedProject}>
                <DialogTitle>
                    Confirm deletion
                </DialogTitle>
                <div className={'dialog-content'}>
                    {
                        deleting ?
                            <Spinner />
                            :
                            <>
                                <div>
                                    Are you sure you want to delete project {deletedProject}?<br />
                        This operation is irreversible.
                                 </div>
                                <button
                                    type="button"
                                    onClick={() => deleteProject(deletedProject)}
                                >
                                    Delete
                                </button>
                            </>
                    }
                </div>
            </Dialog>
            <div className={'project-list-wrapper'}>
                <h2>My projects</h2>
                <div className={'project-list'}>
                    <List />
                </div>
            </div>
        </>
    );
}