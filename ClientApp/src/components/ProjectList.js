import React, { useState } from 'react'
import { useEffect } from 'react';
import { authService } from '../AuthService';
import { Link, withRouter } from 'react-router-dom';
import './ProjectList.css';
import { Icon, InlineIcon } from '@iconify/react';
import warningStandardSolid from '@iconify-icons/clarity/warning-standard-solid';

export default function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [currentUser, setCurrentUser] = useState(authService.currentUserValue());

    useEffect(() => {
        authService.currentUser.subscribe(u => {
            setCurrentUser(u);
        });
    }, [])

    useEffect(() => {
        if (currentUser) {
            var headers = new Headers();
            authService.addAuthHeader(headers);

            fetch('api/project', {
                headers: headers
            })
                .then(res => res.json())
                .then(projects => setProjects(projects))
                .catch(ex => console.log(ex));
        }   
    }, [currentUser]);

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
                                    { width: `${(project.finishedStitches / project.totalStitches)*100}%` }
                                }>
                            </div>
                        </div>
                    </div>
                    </div>
                </Link>
            );
        });
    }

    if (!currentUser)
        return (
            <div className={'warning-screen'}>
                <Icon icon={warningStandardSolid} />
                You need to be logged in to access your projects
            </div>
            );

    return (
        <div className={'project-list-wrapper'}>
            <h2>My projects</h2>
            <div className={'project-list'}>
                <List />
            </div>
        </div>
        );
}