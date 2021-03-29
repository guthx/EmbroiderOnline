import React, { Component } from 'react';

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
