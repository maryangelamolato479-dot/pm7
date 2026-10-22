import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@captured_photos';

export default function App() {
  // Navigation & Authentication States
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'register' | 'home'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Camera & Storage States
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState([]);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const cameraRef = useRef(null);

  // Load photos from AsyncStorage when entering the home screen
  useEffect(() => {
    if (currentScreen === 'home') {
      loadPhotos();
    }
  }, [currentScreen]);

  // Handle Registration
  const handleRegister = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    Alert.alert('Success', 'Account registered successfully! Please login.');
    setCurrentScreen('login');
  };

  // Handle Login
  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password.');
      return;
    }
    setCurrentScreen('home');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentScreen('login');
    setUsername('');
    setPassword('');
  };

  // 1. Retrieve and Display Saved Data from AsyncStorage
  const loadPhotos = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData !== null) {
        setPhotos(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  // 2. Save Photo to Storage Technology (AsyncStorage)
  const savePhoto = async (newPhotoUri) => {
    try {
      const newPhoto = {
        id: Date.now().toString(),
        uri: newPhotoUri,
        createdAt: new Date().toLocaleString(),
      };
      const updatedPhotos = [newPhoto, ...photos];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
      setPhotos(updatedPhotos);
      Alert.alert('Success', 'Photo saved to storage!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo.');
    }
  };

  // 3. Delete / Remove Saved Data
  const deletePhoto = async (id) => {
    try {
      const updatedPhotos = photos.filter((item) => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
      setPhotos(updatedPhotos);
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete photo.');
    }
  };

  const confirmDelete = (id) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePhoto(id) },
    ]);
  };

  // 4. Capture Photo using Camera Component
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        setIsCameraVisible(false);
        await savePhoto(photo.uri);
      } catch (error) {
        console.error('Failed to take picture:', error);
      }
    }
  };

  // --- SCREEN 1: LOGIN SCREEN ---
  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={styles.authContainer}>
        <Text style={styles.authTitle}>Sign In</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentScreen('register')}>
          <Text style={styles.linkText}>Don't have an account? Register here</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- SCREEN 2: REGISTER SCREEN ---
  if (currentScreen === 'register') {
    return (
      <SafeAreaView style={styles.authContainer}>
        <Text style={styles.authTitle}>Create Account</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentScreen('login')}>
          <Text style={styles.linkText}>Already have an account? Login here</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Camera Permission Handling
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- SCREEN 3: HOME / GALLERY SCREEN ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo Storage Gallery</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.openCameraButton}
            onPress={() => setIsCameraVisible(true)}
          >
            <Text style={styles.openCameraText}>Open Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {photos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No saved photos yet. Tap "Open Camera" to take one!</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.uri }} style={styles.cardImage} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardDate}>{item.createdAt}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => confirmDelete(item.id)}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Camera View Modal */}
      <Modal visible={isCameraVisible} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} ref={cameraRef}>
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsCameraVisible(false)}
              >
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  authContainer: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#ffffff' },
  authTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkText: { color: '#007AFF', textAlign: 'center', marginTop: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  openCameraButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  openCameraText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  logoutButton: { backgroundColor: '#8E8E93', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  permissionText: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
  listContainer: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 3 },
  cardImage: { width: '100%', height: 200 },
  cardInfo: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 12, color: '#666' },
  deleteButton: { backgroundColor: '#FF3B30', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  deleteText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
  closeButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
    marginTop: 40,
  },
  closeText: { color: '#fff', fontSize: 16 },
  captureButton: {
    alignSelf: 'center',
    marginBottom: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff' },
});