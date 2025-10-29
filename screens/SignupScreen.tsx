import React, { useState, useEffect } from "react";
import { View, Text, Button, Image, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';

import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; // your exports
import Constants from "expo-constants";

export default function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showGif, setShowGif] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = useState(false);


    const extra = Constants.expoConfig?.extra as any;
    const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: extra.googleAuth.expoClientId,
    androidClientId: extra.googleAuth.androidClientId, // optional for Expo Go
    iosClientId: extra.googleAuth.iosClientId,         // optional for Expo Go
    // Request an ID token for Firebase:
    responseType: "id_token",
    scopes: ["profile", "email"],
  });



  const signUpEmail = async () => {
    if (!username || !username.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      // Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, username.trim(), password);
      const user = userCredential.user;

      // Optional: write a user document in Firestore for app-specific data
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: null,
        job: null,
        food:0,
        utilities:0,
        credit:null,
        creditCardBill:0,
        password: password,
        housing:"rent",
        lifeStatus:1,
        createdAt: serverTimestamp(),
        emergencyAlerts:null,
        reminders:null,
        day:1,
        checkingAccount:100,

      });

      // Send verification email (optional)
      

      // Show GIF then navigate back to Login
      setShowGif(true);
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }, 900);
    } catch (e: any) {
      console.error('signUp error', e);
      Alert.alert('Sign-up error', `${e.code || 'error'}: ${e.message || String(e)}`);
      setShowGif(true);
    } finally {
      setLoading(false);
    }
  };



  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });

  const handlePress = () => {
    setShowGif(true);
    setTimeout(() => {
      navigation.navigate('Main');
    }, 900);
  };











  const styles = StyleSheet.create({
    input: {
      height: 40,
      width: 250,
      marginTop: 15,
      marginBottom:10,
      borderWidth: 1.5,
      borderColor: '#C97D60',
      borderRadius: 10,
      paddingHorizontal: 10,
      backgroundColor: '#fff8f3',
      fontFamily: 'Pixel',
      fontSize: 14,
      color: '#63372C',
      textAlign: 'center',
    },
  });












  return (
    <View style={{ 
      flex: 1,
      alignItems: 'center',
      backgroundColor: '#F2E5D7',
    }}>
      <Text style={{
        fontSize: 80,
        color: '#C97D60',
        fontFamily: 'Windows',
        marginBottom: 0,
        marginTop: 10,
      }}>
        title.
      </Text>

      {showGif ? (
        <Image 
          source={require('../assets/pig_icon(gif).gif')}
          style={{
            width: 200,
            height: 220,
            marginBottom: 0,
            marginTop: 10,
          }}
        />
      ) : (
        <Image 
          source={require('../assets/pig_icon.png')}
          style={{
            width: 200,
            height: 220,
            marginBottom: 0,
            marginTop: 10,
          }}
        />
      )}

      {/* New Input Fields Below the Login Button */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#C97D60"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="*6 or more chars PW*"
        placeholderTextColor="#C97D60"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={signUpEmail} activeOpacity={0.7}>
        <Image 
          source={require('../assets/button.png')}
          style={{
            width: 200,
            height: 100,
            position: 'absolute',
            alignSelf: 'center',
          }}
        />
        <Text style={{
          paddingTop: 30,
          marginBottom: 30,
          alignItems: 'center',
          justifyContent: 'center',
          color: '#63372C',
          fontSize: 20,
          fontWeight: 'bold',
          fontFamily: 'Pixel',
          textAlign: 'center',
        }}>
          SIGNUP
        </Text>
      </TouchableOpacity>

    </View>
  );
}
