import React, { useEffect, useState } from 'react';
import { Link, Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Collapse, Nav, Navbar, NavbarBrand, NavbarToggler, DropdownMenu, NavLink, Dropdown, DropdownToggle, DropdownItem } from 'reactstrap';
import { authService } from '../AuthService';
import { Home } from './Home';
import './NavMenu.css';
import Project from './Project';
import ProjectList from './ProjectList';
import Spinner from './Spinner';

export default function NavMenu() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        authService.currentUser.subscribe(user => setCurrentUser(user));
    }, []);
    console.log(currentUser);
    return (
        <Router>
        <header>
            <nav className={'nav-bar'}>
            {
                    currentUser == null ?
                        <>
                            <LoginMenu />
                            <RegisterMenu />
                        </>
                        :
                        <>
                            <div className={'nav-item'}>
                                <div
                                    className={'nav-button'}
                                    onClick={e => authService.logout()}
                                >
                                    Logout
                                </div>
                            </div>
                            <div className={'nav-item username'}>
                                Logged in as {currentUser.username}
                            </div>
                                <div className={'nav-item'}>
                                    <div className={'nav-button'}>
                                        <Link to="/projects">My projects</Link>
                                    </div>
                                </div>
                        </>
            }
            </nav>
                
            
            </header>
            <Switch>
                <Route path="/projects">
                    <ProjectList />
                </Route>
                <Route path="/project/:id">
                    <Project />
                </Route>
                <Route path="/">
                    <Home />
                </Route>
            </Switch>
        </Router>
    );
}


function LoginMenu() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [wrongCredentials, setWrongCredentials] = useState(false);
    const [awaiting, setAwaiting] = useState(false);

    return (
        <div className={'login nav-item'}>
            <div
                className={'login-menu-collapse nav-button'}
                onClick={e => setIsOpen(!isOpen)}
            >
                <div className={'button-text'}>
                    Login
                </div>
            </div>
            <div className={`login-menu nav-dropdown ${isOpen ? "collapsed" : ""}`} >
                <div className={'warning nav-dropdown-item'}>
                    {
                        wrongCredentials &&
                        "Wrong e-mail or password"
                    }
                </div>
                <div className={'nav-dropdown-item'}>
                    <label for="email-input">E-mail</label>
                    <input id="email-input" type="text" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className={'nav-dropdown-item'}>
                    <label for="password-input">Password</label>
                    <input id="password-input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                {
                    !awaiting ?
                        <button
                            className={'nav-dropdown-item'}
                            type="button"
                            disabled={email.length < 3 || password.length < 3}
                            onClick={e => {
                            setAwaiting(true);
                            authService.login(email, password)
                                .then(user => {
                                    setAwaiting(false);
                                    if (user == null)
                                        setWrongCredentials(true);
                                    else {
                                        setIsOpen(false);
                                        setWrongCredentials(false);
                                    }

                                })
                        }}>
                            Login
                </button>
                        :
                        <Spinner />
                }

            </div>
        </div>
    );
}


function RegisterMenu() {
    const [username, setUsername] = useState("");
    const [usernameCorrect, setUsernameCorrect] = useState(false);
    const [email, setEmail] = useState("");
    const [emailCorrect, setEmailCorrect] = useState(false);
    const [emailTaken, setEmailTaken] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordCorrect, setPasswordCorrect] = useState(false);
    const [repeatPassword, setRepeatPassword] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [passwordsDontMatch, setPasswordsDontMatch] = useState(false);
    const [awaiting, setAwaiting] = useState(false);
    const [error, setError] = useState("");
    const [focus, setFocus] = useState("");

    const emailRegex = /\w+@\w+\.\w+/;

    return (
        <div className={'register nav-item'}>
            <div
                className={'register-menu-collapse nav-button'}
                onClick={e => setIsOpen(!isOpen)}
            >
                <div className={'button-text'}>
                    Register
                </div>
            </div>
            <div className={`register-menu nav-dropdown ${isOpen ? "collapsed" : ""}`} >
                {
                    !emailCorrect && email.length > 0 && focus != 'email' &&
                    <div className={'warning nav-dropdown-item'}>
                        Incorrect e-mail format
                    </div>
                }
                {
                    emailTaken &&
                    <div className={'warning nav-dropdown-item'}>
                        There is already an account with this e-mail
                    </div>
                }
                <div className={'nav-dropdown-item'}>
                    <label for="email-input">E-mail</label>
                    <input
                        id="email-input" type="text"
                        value={email}
                        onFocus={e => setFocus('email')}
                        onChange={e => setEmail(e.target.value)}
                        onBlur={e => {
                            setFocus('');
                            if (emailRegex.test(e.target.value))
                                setEmailCorrect(true);
                            else
                                setEmailCorrect(false);
                        }}
                    />
                </div>
                {
                    !usernameCorrect && username.length > 0 && focus != 'username' &&
                    <div className={'warning nav-dropdown-item'}>
                        Username must be between 3-18 characters
                    </div>
                }
                <div className={'nav-dropdown-item'}>
                    <label for="username-input">Username</label>
                    <input id="username-input"
                        type="text"
                        value={username}
                        onFocus={e => setFocus("username")}
                        onChange={e => setUsername(e.target.value)}
                        onBlur={e => {
                            setFocus('');
                            if (e.target.value.length < 3 || e.target.value.length > 18)
                                setUsernameCorrect(false);
                            else
                                setUsernameCorrect(true);
                        }}
                    />
                </div>
                {
                    !passwordCorrect  && password.length > 0 && focus != 'password' &&
                    <div className={'warning nav-dropdown-item'}>
                        Password must be between 3-18 characters
                    </div>
                }
                <div className={'nav-dropdown-item'}>
                    <label for="password-input">Password</label>
                    <input id="password-input"
                        type="password"
                        value={password}
                        onFocus={e => setFocus('password')}
                        onChange={e => setPassword(e.target.value)}
                        onBlur={e => {
                            setFocus('');
                            if (e.target.value.length < 3 || e.target.value.length > 18)
                                setPasswordCorrect(false);
                            else
                                setPasswordCorrect(true);
                        }}
                    />
                </div>
                {
                    passwordsDontMatch && focus != 'repeatPassword' &&
                    <div className={'warning nav-dropdown-item'}>
                        Passwords don't match
                    </div>
                }
                <div className={'nav-dropdown-item'}>
                    <label for="repeat-password-input">Repeat password</label>
                    <input id="repeat-password-input"
                        type="password"
                        value={repeatPassword}
                        onChange={e => setRepeatPassword(e.target.value)}
                        onFocus={e => setFocus('repeatPassword')}
                        onBlur={e => {
                            setFocus('');
                            if (e.target.value == password)
                                setPasswordsDontMatch(false);
                            else
                                setPasswordsDontMatch(true);
                        }}
                    />
                </div >
                {
                    error.length > 0 &&
                    <div className={'warning nav-dropdown-item'}>
                        {error}
                    </div>
                }
                {
                    !awaiting ?
                        <button
                            type="button"
                            className={'nav-dropdown-item'}
                            disabled={!usernameCorrect || !passwordCorrect || !emailCorrect || passwordsDontMatch}
                            onClick={e => {
                                setAwaiting(true);
                                fetch('api/user', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        username: username,
                                        password: password,
                                        email: email
                                    })
                                })
                                    .then(res => {
                                        if (res.ok)
                                            authService.login(email, password);
                                        else if (res.status == 409)
                                            setEmailTaken(true);
                                        else
                                            setError(res.statusText);
                                        setAwaiting(false);
                                    })
                                    .catch(error => {
                                        setError("An unspecified error has occured");
                                        setAwaiting(false);
                                    });
                        }}>
                            Register
                </button>
                        :
                        <Spinner />
                }

            </div>
        </div>
    );
}