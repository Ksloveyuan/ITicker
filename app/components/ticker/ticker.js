'use strict';

import React,{ Component } from 'react';
import {AppState, Platform,StyleSheet,StatusBar,View } from 'react-native';

import Storage from 'react-native-storage';
import { AsyncStorage } from 'react-native';

import WatchControl from './watchControl';
import WatchFace from './watchFace';
import WatchRecord from './watchRecord';

export default class extends Component{
  constructor() {
    super();
      this.state = {
        stopWatch: false,
        resetWatch: true,
        intialTime: 0,
        currentTime:0,
        recordTime:0,
        timeAccumulation:0,
        totalTime: "00:00.00",
        sectionTime: "00:00.00",
        recordCounter: 0,
        record:[
          {title:"",time:""},
          {title:"",time:""},
          {title:"",time:""},
          {title:"",time:""},
          {title:"",time:""},
          {title:"",time:""},
          {title:"",time:""}
        ],
    };
    
    this.storage = new Storage({
      // maximum capacity, default 1000 
      size: 10000,

      // Use AsyncStorage for RN, or window.localStorage for web.
      // If not set, data would be lost after reload.
      storageBackend: AsyncStorage,

      // expire time, default 1 day(1000 * 3600 * 24 milliseconds).
      // can be null, which means never expire.
      defaultExpires: null,

      // cache data in the memory. default is true.
      enableCache: true,

      // if data was not found in storage or expired,
      // the corresponding sync method will be invoked and return 
      // the latest data.
      sync: {
        // we'll talk about the details later.
      }
    });
  }

  componentWillUnmount() {
    this._stopWatch();
   // this._clearRecord();
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  componentDidMount() {
    if(Platform.OS === "ios"){
      StatusBar.setBarStyle(0);
    }

    AppState.addEventListener('change', this._handleAppStateChange);

    this.storage.load({key: "state"})
    .then(result=>{
      this.setState(result);
    }, err=>{
      console.log(err);
    });
  }

  _handleAppStateChange = (nextAppState) => {
    if(nextAppState !== "active"){
      this.storage.save({
        key: "state",
        data: this.state
      });
    }
  }

  _startWatch() {
    if (this.state.resetWatch) {
      this.setState({
        stopWatch: false,
        resetWatch: false,
        timeAccumulation:0,
        initialTime: (new Date()).getTime()
      })
    }else{
      this.setState({
        stopWatch: false,
        initialTime: (new Date()).getTime()
      })
    }
    let milSecond, second, minute, countingTime, secmilSecond, secsecond, secminute, seccountingTime;
    let interval = setInterval(
        () => { 
          this.setState({
            currentTime: (new Date()).getTime()
          })
          countingTime = this.state.timeAccumulation + this.state.currentTime - this.state.initialTime;
          minute = Math.floor(countingTime/(60*1000));
          second = Math.floor((countingTime-6000*minute)/1000);
          milSecond = Math.floor((countingTime%1000)/10);
          seccountingTime = countingTime - this.state.recordTime;
          secminute = Math.floor(seccountingTime/(60*1000));
          secsecond = Math.floor((seccountingTime-6000*secminute)/1000);
          secmilSecond = Math.floor((seccountingTime%1000)/10);
          this.setState({
            totalTime: (minute<10? "0"+minute:minute)+":"+(second<10? "0"+second:second)+"."+(milSecond<10? "0"+milSecond:milSecond),
            sectionTime: (secminute<10? "0"+secminute:secminute)+":"+(secsecond<10? "0"+secsecond:secsecond)+"."+(secmilSecond<10? "0"+secmilSecond:secmilSecond),
          })
          if (this.state.stopWatch) {
            this.setState({
              timeAccumulation: countingTime 
            })
            clearInterval(interval)
          };
        },10);
  }

  _stopWatch() {
    this.setState({
      stopWatch: true
    })
  }

  _addRecord() {
    let {recordCounter, record} = this.state;
    recordCounter++;
    if (recordCounter<8) {
      record.pop();
    }
    record.unshift({title:"计次"+recordCounter,time:this.state.sectionTime});
    this.setState({
      recordTime: this.state.timeAccumulation + this.state.currentTime - this.state.initialTime,
      recordCounter: recordCounter,
      record: record
    })
    //use refs to call functions within other sub component
    //can force to update the states
    // this.refs.record._updateData();
  }

  _clearRecord() {
    this.setState({
      stopWatch: false,
      resetWatch: true,
      intialTime: 0,
      currentTime:0,
      recordTime:0,
      timeAccumulation:0,
      totalTime: "00:00.00",
      sectionTime: "00:00.00",
      recordCounter: 0,
      record:[
        {title:"",time:""},
        {title:"",time:""},
        {title:"",time:""},
        {title:"",time:""},
        {title:"",time:""},
        {title:"",time:""},
        {title:"",time:""}
      ],
     });

    this.storage.clearMapForKey("state");

    console.log("clear");
  }

  render(){
    return(
      <View style={styles.watchContainer}>
        <WatchFace totalTime={this.state.totalTime} sectionTime={this.state.sectionTime}></WatchFace>
        <WatchControl addRecord={()=>this._addRecord()} clearRecord={()=>this._clearRecord()} startWatch={()=>this._startWatch()} stopWatch={()=>this._stopWatch()}></WatchControl>
        <WatchRecord record={this.state.record}></WatchRecord>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  watchContainer:{
    alignItems: "center",
    backgroundColor: "#f3f3f3",
    marginTop: 60,
  },
});