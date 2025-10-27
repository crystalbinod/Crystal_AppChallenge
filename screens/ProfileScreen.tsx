// screens/ProfileScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Button, Image, ImageBackground,TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {


  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const screenWidth= useWindowDimensions().width
  const [name, setName] = useState('');
  useEffect(() => {
    // Load saved name
    AsyncStorage.getItem('userText').then((savedName) => {
      if (savedName) setName(savedName);
    });
  }, []);

  const handleChange = async (value: string) => {
    // local update
    setName(value);

    // persist to AsyncStorage (best-effort)
    try {
      await AsyncStorage.setItem('userText', value);
    } catch (e) {
      console.warn('Failed to save name to AsyncStorage', e);
    }

    // persist to Firestore under users/{uid}
    const user = auth.currentUser;
    if (!user) {
      // not signed in — nothing to save server-side
      return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), { displayName: value }, { merge: true });
    } catch (e) {
      console.error('Failed to save user name to Firestore', e);
    }
  };

  return (

    
    // Center the content in the screen
    <ScrollView style={{ 
                flex: 1, 
                backgroundColor: '#F2E5D7',
                flexDirection: 'space-evenly'
              }}>
                
                
                <View style={{ 
            flex: 1, 
            backgroundColor: '#F2E5D7',
            flexDirection:"row"
          }}>
               {/* column 1 */}
                  <View style={{ 
                          flex: 1, 
                          backgroundColor: '#F2E5D7',
                          margin:20,
                          
                        }}>
                          {/* row 1 */}
                          {/* Login Title */}
                          <View style={{
                            backgroundColor:'#63372C',
                            borderRadius:25,
                            width: screenWidth/2-15,
                            height: 100,
                            
                            
                            
                            }}>
                            <Text style={{
                            fontSize: 15,
                            color: '#C97D60',
                            fontFamily: 'Pixel',
                            fontWeight:"bold" ,
                            margin:5,
                            marginLeft:17,
                            

                            }}>
                              login info:
                              </Text>
                              <TextInput
                              placeholder='name?'
                              onChangeText={handleChange}
                              value={name}
                              style={{
                                height: 23,
                                padding: 5,
                                marginHorizontal: 8,
                                borderWidth: 2,
                                fontSize:12,
                                fontFamily:'Pixel',
                                backgroundColor:'#C97D60',
                                borderRadius:10,
                                borderColor:"#44251dff"
                              }}
                              />
                          </View>

                          {/* row 2 */}
                          <View style={{
                            backgroundColor:'#63372C',
                            borderRadius:25,
                            width: screenWidth/2-15,
                            height: 300,
                            marginTop:10,
                            
                            
                            }}>
                            <Text style={{
                            fontSize: 15,
                            color: '#C97D60',
                            fontFamily: 'Pixel',
                            fontWeight:"bold" ,
                            margin:5,
                            marginLeft:17,
                            

                            }}>
                              status:
                              </Text>
                          </View>
                          
                          
                
                </View>
                
                {/* column 2 */}
                <View style={{ 
                      flex: 1, 
                      backgroundColor: '#F2E5D7',
                      margin:20,  
                          
                      }}>

                      {/* row 1 */}
                      {/* Home Screen Title */}
                      <View style={{
                            backgroundColor:'#63372C',
                            borderRadius:15,
                            width: screenWidth/2-50,
                            height: 150,
                            
                            
                            
                            }}>
                            <Text style={{
                            fontSize: 15,
                            color: '#C97D60',
                            fontFamily: 'Pixel',
                            fontWeight:"bold" ,
                            margin:5,
                            marginLeft:17,
                            

                            }}>
                              sefdsasdfsdf
                              </Text>
                          </View>
                          
                
                </View>
            
                </View>

                {/* row 2 */}
    
                {/* column 2 */}
                {/* Logout Button */}
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              await signOut(auth);
                              // Reset stack to Login
                              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                            } catch (err) {
                              console.error('Sign-out error', err);
                            }
                          }}
                          activeOpacity={0.7}  
                        >
                         <ImageBackground
                            source={require('../assets/button.png')}
                            style={{ width: 200, height: 100, justifyContent: 'center', alignItems: 'center' }}
                          >
                            <Text style={{
                              color: '#63372C',
                              fontSize: 20,
                              fontWeight: "bold",
                              fontFamily: "Pixel",
                            }}>
                              Logout
                            </Text>
                          </ImageBackground>
                        </TouchableOpacity>
                
        </ScrollView>
  );
}