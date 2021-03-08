import React, { Component } from 'react';
import { Route } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { FetchData } from './components/FetchData';
import { Counter } from './components/Counter';

import './custom.css'
import NavMenu from './components/NavMenu';

export default class App extends Component {
  static displayName = 'Embroider';

  render () {
      return (
          <>
            <NavMenu />
          </>
    );
  }
}
