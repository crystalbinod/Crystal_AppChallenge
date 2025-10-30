// screens/LoginScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, Button, Image, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';

import * as Google from "expo-auth-session/providers/google";
// Firebase authentication and Firestore imports
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; // Firebase config export
import Constants from "expo-constants";

export default function LoginScreen() {
  // Navigation hook with type safety
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // UI and input states
  const [showGif, setShowGif] = React.useState(false);
  const [email, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = useState(false);

//Google Authentication setup
  // Get credentials from app.json -> extra.googleAuth
  const extra = Constants.expoConfig?.extra as any;

  // Configure Google Auth Request for Expo
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: extra.googleAuth.expoClientId,
    androidClientId: extra.googleAuth.androidClientId,
    iosClientId: extra.googleAuth.iosClientId,
    responseType: "id_token", // Needed for Firebase auth
    scopes: ["profile", "email"], // Request basic info
  });


// Handle Google OAuth response -> Firebase sign-in
    // When response changes, check if Google sign-in succeeded
  useEffect(() => {
    const doLogin = async () => {
      if (response?.type === "success") {
        // Get ID token from Google response
        const idToken = (response.authentication as any)?.idToken || response.params?.id_token;
        if (!idToken) {
          Alert.alert("Google sign-in failed", "No ID token received.");
          return;
        }

        // Convert Google token into Firebase credentials and log in
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      }
    };
    doLogin();
  }, [response]);


//Monitor auth state 
  // Runs once when the component mounts
  // Redirects to the 'Main' screen if the user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    });
    return unsubscribe; // Cleanup when unmounted
  }, []);



//Email/Password login function
  const signInEmail = async () => {
    // Basic validation for email format

    setLoading(true);
    try {
      // Try Firebase email/password login
      await signInWithEmailAndPassword(auth, email.trim(), password);

      // Show pig GIF for feedback
      setShowGif(true);

      // Navigate to main screen after short delay
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }, 900);
      
    } catch (e: any) {
      // Handle login errors
      console.error('signInWithEmail error', e);
      Alert.alert('Sign-in error', `${e.code || 'error'}: ${e.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

 
  const handlePress = () => {
    setShowGif(true);
    setTimeout(() => {
      navigation.navigate('Signup');
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
  const [fontsLoaded] = useFonts({
      'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
      'Windows': require('../assets/windows-bold.ttf'),
      'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
      'Pixel': require('../assets/pixel.ttf'),
    });
















  return (
    <View style={{ 
      flex: 1,
      alignItems: 'center',
      backgroundColor: '#F2E5D7',
    }}>
      <Text style={{
        fontSize: 50,
        color: '#C97D60',
        fontFamily: 'Windows',
        marginBottom: 0,
        marginTop: 90,
      }}>
        piggybank.
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
        placeholder="Email"
        placeholderTextColor="#C97D60"
        value={email}
        onChangeText={setUsername}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#C97D60"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={signInEmail} activeOpacity={0.7}>
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
          LOGIN
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        
        <Text style={{
          
          alignItems: 'center',
          justifyContent: 'center',
          color: '#63372C',
          fontSize: 10,
          fontWeight: 'bold',
          fontFamily: 'Pixel',
          marginTop:20,
          textAlign: 'center',
        }}>
          signup
        </Text>
      </TouchableOpacity>

      
    </View>
  );
}
