import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import * as sinon from 'sinon';
import { ArcView } from '../../../src/ts/components/ArcBase';

export default () => (
    describe('ArcBase', () => {
        describe('as a shallow component', () => {
            let arcView;
            beforeEach(() => {
                arcView = shallow(<ArcView loadMap={sinon.stub()} scriptUri={['foo', 'bar']} />);
            });

            it('should exist', () => {
                expect(arcView).to.exist;
            });

            it('should render the default loading component', () => {
                expect(arcView.find('#react-arcgis-loading-text')).to.have.length(1);
            });

            describe('the user has included a custom loading component', () => {
                const customComponent = () => (<h3 id="custom-load-component" />);
                beforeEach(() => {
                    arcView = mount(<ArcView loadComponent={customComponent} loadMap={sinon.stub()} scriptUri={['foo', 'bar']} />);
                });

                it('should not render the default loading component', () => {
                    expect(arcView.find('#react-arcgis-loading-text')).to.have.length(0);
                });

                it('should render the custom loading component', () => {
                    expect(arcView.find('#custom-load-component')).to.have.length(1);
                });
            });
        });

        describe('as a mounted component', () => {
            let arcView
            beforeEach(() => {
                sinon.spy(ArcView.prototype, 'componentDidMount');
                arcView = mount(<ArcView loadMap={sinon.stub()} scriptUri={['foo', 'bar']} />);
            });

            it('should call componentDidMount', () => {
                expect(ArcView.prototype.componentDidMount['callCount']).to.equal(1);
            });

            describe('esriPromise succeeds', () => {
                beforeEach(() => {
                    global['asyncSuccess'] = true;
                    arcView = mount(<ArcView loadMap={sinon.stub()} scriptUri={['foo', 'bar']} />);
                });

                it('should call loadMap with the result of esriPromise', (done) => {
                    setTimeout(() => {
                        expect(arcView.props().loadMap.callCount).to.equal(1);
                        expect(arcView.props().loadMap.calledWith('success')).to.be.true;
                        done();
                    }, 1);
                });

                describe('the loadMap method succeeds', () => {
                    let loadMap;
                    beforeEach(() => {
                        loadMap = () => ({
                            then(callback, errback) {
                                callback({
                                    map: 'foo',
                                    view: 'bar'
                                });
                            }
                        });
                        arcView = mount(<ArcView loadMap={loadMap} scriptUri={['foo', 'bar']} />);
                    });

                    it('should not display the failed state for the application', (done) => {
                        setTimeout(() => {
                            expect(arcView.find('#react-arcgis-fail-text')).to.have.length(0);
                            done();
                        }, 1);
                    });

                    it('should set the state of the map and view based on the result of loadMap', (done) => {
                        setTimeout(() => {
                            expect(arcView.instance().state.map).to.equal('foo');
                            expect(arcView.instance().state.view).to.equal('bar');
                            done();
                        }, 1);
                    });

                    describe('the user has included an onLoad callback', () => {
                        const onLoad = sinon.stub();
                        beforeEach(() => {
                            arcView = mount(<ArcView loadMap={loadMap} scriptUri={['foo', 'bar']} onLoad={onLoad} />);
                        });

                        it('should call onLoad with a reference to the map and view', (done) => {
                            setTimeout(() => {
                                const callback = arcView.instance().props.onLoad;
                                expect(callback.callCount).to.equal(1);
                                expect(callback.calledWith('foo', 'bar')).to.be.true;
                                done();
                            }, 1);
                        });
                    });

                    describe('the user updates the mapProperties or viewProperties', () => {
                        const getterSetter = {
                            set(key, value) {
                                if (this[key]) {
                                    this[key] = value;
                                }
                            },
                            get(key) {
                                if (this[key]) {
                                    return this[key];
                                }
                                return undefined;
                            }
                        };
                        beforeEach(() => {
                            loadMap = () => ({
                                then(callback, errback) {
                                    callback({
                                        map: {
                                            ...getterSetter,
                                            foo: 'bar'
                                        },
                                        view: {
                                            ...getterSetter,
                                            foo: 'bar',
                                            set(changeObj) {
                                                Object.keys(changeObj).forEach((key) => {
                                                    if (this[key]) {
                                                        this[key] = changeObj[key];
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                            arcView = mount(
                                <ArcView
                                    loadMap={loadMap} scriptUri={['foo', 'bar']}
                                    mapProperties={{
                                        foo: 'bar'
                                    }}
                                    viewProperties={{
                                        foo: 'bar'
                                    }}
                                />
                            );
                        });

                        describe('the user updates the mapProperties with a valid key', () => {
                            it('should update the JS API accordingly', (done) => {
                                setTimeout(() => {
                                    arcView.setProps({ mapProperties: { foo: 'banana' } });
                                    expect(arcView.props().mapProperties.foo).to.equal('banana');
                                    expect(arcView.instance().state.map.foo).to.equal('banana');
                                    done();
                                }, 1);
                            });
                        });

                        describe('the user updates the mapProperties with an invalid key', () => {
                            it('should make no change to the JS API', (done) => {
                                setTimeout(() => {
                                    arcView.setProps({ mapProperties: { foo: 'bar', bar: 'foo' } });
                                    expect(arcView.props().mapProperties.bar).to.equal('foo');
                                    expect(arcView.instance().state.map.foo).to.equal('bar');
                                    expect(arcView.instance().state.map.bar).to.not.exist;
                                    done();
                                }, 1);
                            });
                        });

                        describe('the user updates the viewProperties with a valid key', () => {
                            it('should update the JS API accordingly', (done) => {
                                setTimeout(() => {
                                    arcView.setProps({ viewProperties: { foo: 'banana' } });
                                    expect(arcView.props().viewProperties.foo).to.equal('banana');
                                    expect(arcView.instance().state.view.foo).to.equal('banana');
                                    done();
                                }, 1);
                            });
                        });

                        describe('the user updates the mapProperties with an invalid key', () => {
                            it('should make no change to the JS API', (done) => {
                                setTimeout(() => {
                                    arcView.setProps({ viewProperties: { foo: 'bar', bar: 'foo' } });
                                    expect(arcView.props().viewProperties.bar).to.equal('foo');
                                    expect(arcView.instance().state.view.foo).to.equal('bar');
                                    expect(arcView.instance().state.view.bar).to.not.exist;
                                    done();
                                }, 1);
                            });
                        });
                    });
                });

                describe('the loadMap method fails', () => {
                    let loadMap;
                    beforeEach(() => {
                        loadMap = () => ({
                            then(callback, errback) {
                                errback(new Error('failed'));
                            }
                        });
                        arcView = mount(<ArcView loadMap={loadMap} scriptUri={['foo', 'bar']} />);
                    });

                    it ('should display the failed state for the application', (done) => {
                        setTimeout(() => {
                            expect(arcView.find('#react-arcgis-fail-text')).to.have.length(1);
                            done();
                        }, 1);
                    });
                });
            });

            describe('esriPromise fails', () => {
                beforeEach(() => {
                    global['asyncSuccess'] = false;
                    arcView = mount(<ArcView loadMap={sinon.stub()} scriptUri={['foo', 'bar']} />);
                });

                it('should not call loadMap', (done) => {
                    setTimeout(() => {
                        expect(arcView.props().loadMap.callCount).to.equal(0);
                        done();
                    }, 1);
                });

                it('should display the default failed state for the application', (done) => {
                    setTimeout(() => {
                        expect(arcView.find('#react-arcgis-fail-text')).to.have.length(1);
                        done();
                    }, 1);
                });

                describe('the user has included a custom fail component', () => {
                    const failComponent = () => (<h3 id="custom-fail-component" />);
                    beforeEach(() => {
                        arcView = mount(<ArcView failComponent={failComponent} loadMap={sinon.stub()} scriptUri={['foo', 'bar']} />);
                    });

                    it('should not display the default failed state for the application', (done) => {
                        setTimeout(() => {
                            expect(arcView.find('#react-arcgis-fail-text')).to.have.length(0);
                            done();
                        }, 1);
                    });

                    it('should display the custom fail component', (done) => {
                        setTimeout(() => {
                            expect(arcView.find('#custom-fail-component')).to.have.length(1);
                            done();
                        }, 1);
                    });
                });

                describe('the user has included a custom fail callback', () => {
                    beforeEach(() => {
                        arcView = mount(<ArcView onFail={sinon.stub()} loadMap={sinon.stub()} scriptUri={['foo', 'bar']} />);
                    });

                    it('should call the failure callback', (done) => {
                        setTimeout(() => {
                            expect(arcView.props().onFail.callCount).to.equal(1);
                            done();
                        }, 1);
                    });
                })
            });

            afterEach(() => {
                ArcView.prototype.componentDidMount['restore']();
            });
        });
    })
);
