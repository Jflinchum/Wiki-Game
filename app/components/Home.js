import React, { Component } from 'react';
import { Form, Col, Row, FormControl, ControlLabel, Button } from 'react-bootstrap';
import classNames from 'classnames';
import styles from './Home.css';
import { generate } from '../utils/generate';


export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [],
      minPar: 3,
      maxPar: 20,
      body: null,
      clicks: null,
      initArt: '',
      goalArt: '',
      loading: true
    };
    this.refresh = this.refresh.bind(this);
  }

  componentDidMount() {
    this.refresh();
  }

  refresh() {
    this.setState({ loading: true });
    const par = Math.floor((Math.random() *
    (this.state.maxPar - this.state.minPar)) + this.state.minPar);
    generate({
      initArticle: this.state.initArt,
      goalArticle: this.state.goalArt,
      par
    }, (err, history) => {
      if (err) {
        console.log(err);
      }
      console.log(history);
      this.setState({ history, clicks: null, loading: false });
      this.forceUpdate();
    });
  }

  render() {
    return (
      <div>
        <div className={styles.container}>
          <div className={styles.ui}>
            <Row className={classNames(styles.row)}>
              {
                !this.state.loading
                ? <h4>Get from {` ${this.state.history[0].title} `}
                  to {` ${this.state.history[this.state.history.length - 1].title} `} with a
                  par of {` ${this.state.history.length - 1}.`} Current clicks:
                  {` ${this.state.clicks ? this.state.clicks : 0}.`}</h4>
                : <h4>Loading...</h4>
              }
            </Row>
            <Form inline>
              <Row className={classNames(styles.row, styles.options)}>
                <Col componentClass={ControlLabel} xs={2}>
                  Initial Article
                </Col>
                <Col xs={6}>
                  <FormControl
                    type="text"
                    placeholder={this.state.history[0] ?
                      this.state.history[0].link :
                      ''}
                    onChange={(event) => { this.setState({ initArt: event.target.value }); }}
                  />
                </Col>
              </Row>
              <Row className={classNames(styles.row, styles.options)}>
                <Col componentClass={ControlLabel} xs={2}>
                  Goal Article
                </Col>
                <Col xs={6}>
                  <FormControl
                    type="text"
                    placeholder={this.state.history[this.state.history.length - 1] ?
                      this.state.history[this.state.history.length - 1].link :
                      ''}
                    onChange={(event) => { this.setState({ goalArt: event.target.value }); }}
                  />
                </Col>
              </Row>
              <Row className={classNames(styles.row, styles.options)}>
                <Col componentClass={ControlLabel} xs={2}>
                  Minimum Par
                </Col>
                <Col xs={2}>
                  <FormControl
                    type="number"
                    placeholder={this.state.minPar ? this.state.minPar : ''}
                    onChange={(event) => {
                      this.setState({ minPar: event.target.value ?
                        parseInt(event.target.value, 10)
                        : 0 });
                    }}
                  />
                </Col>
                <Col componentClass={ControlLabel} xs={2}>
                  Maximum Par
                </Col>
                <Col xs={2}>
                  <FormControl
                    type="number"
                    placeholder={this.state.maxPar ? this.state.maxPar : ''}
                    onChange={(event) => {
                      this.setState({ maxPar: event.target.value ?
                        parseInt(event.target.value, 10)
                        : 0 });
                    }}
                  />
                </Col>
                <Col xs={2}>
                  <Button
                    bsStyle="default"
                    onClick={(e) => { e.preventDefault(); this.refresh(); this.forceUpdate(); }}
                  >
                    Refresh
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>
          <div className={styles.wiki}>
            {!this.state.loading ?
              <object
                type="text/html" data={this.state.history[0].link} width="100%" height="600px"
                onLoad={() => {
                  if (this.state.clicks !== null) {
                    this.setState({ clicks: this.state.clicks + 1 });
                  } else {
                    this.setState({ clicks: 0 });
                  }
                }}
              />
              : <img className={styles.loading} src="./public/ripple.svg" alt="Loading..." />}
          </div>
        </div>
      </div>
    );
  }
}
