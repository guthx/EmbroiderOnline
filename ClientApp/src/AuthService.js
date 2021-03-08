import React from 'react'
import { BehaviorSubject } from 'rxjs';
const currentUserSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('currentUser')));

export const authService = {
    login,
    logout,
    currentUser: currentUserSubject.asObservable(),
    addAuthHeader,
    currentUserValue
}

function login(email, password) {
    return fetch('api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(res => {
            if (!res.ok)
                throw new Error("Wrong email or password");
            return res.json();
        })
        .then(user => {
            localStorage.setItem('currentUser', JSON.stringify(user));
            currentUserSubject.next(user);
            return user;
        })
        .catch(ex => null);
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUserSubject.next(null);
}

function currentUserValue() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function addAuthHeader(headers) {
    var user = currentUserValue();
    if (user && user.jwt) {
        headers.append('Authorization', `Bearer ${user.jwt}`);
    } else {
        return;
    }
}