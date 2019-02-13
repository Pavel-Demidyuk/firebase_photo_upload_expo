import React from 'react';
import {ActivityIndicator, Button, Clipboard, Image, StyleSheet, Text, View,} from 'react-native';
import {ImagePicker, Permissions} from 'expo';
import uuid from 'uuid';
import * as firebase from 'firebase';

console.disableYellowBox = true;

const firebaseConfig = {
    apiKey: "AIzaSyD_0gyCPlXyBxZ7rP8Le5H_Mtk6ET2-xRc",
    authDomain: "mixels-254f5.firebaseapp.com",
    databaseURL: "https://mixels-254f5.firebaseio.com",
    projectId: "mixels-254f5",
    storageBucket: "mixels-254f5.appspot.com",
    messagingSenderId: "1052869328788"
};


firebase.initializeApp(firebaseConfig);

export default class App extends React.Component {
    state = {
        image: null,
        uploading: false,
    };

    async componentDidMount() {
        // здесь запрашиваются разрешения на доступ к фото
        await Permissions.askAsync(Permissions.CAMERA_ROLL);
        await Permissions.askAsync(Permissions.CAMERA);
    }

    render() {
        let image = this.state.image;

        return (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                {image ? null : (
                    <Text
                        style={{
                            fontSize: 20,
                            marginBottom: 20,
                            textAlign: 'center',
                            marginHorizontal: 15,
                        }}>
                        здесь появится картинка после загрузки
                    </Text>
                )}

                <Button
                    onPress={this._pickImage}
                    title="Выбрать картинку из библиотеки"
                />

                <Button onPress={this._takePhoto} title="Сделать фото"/>

                {this._maybeRenderImage()}
                {this._maybeRenderUploadingOverlay()}
            </View>
        );
    }

    _maybeRenderUploadingOverlay = () => {
        if (this.state.uploading) {
            return (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        },
                    ]}>
                    <ActivityIndicator color="#fff" animating size="large"/>
                </View>
            );
        }
    };

    _maybeRenderImage = () => {
        let image = this.state.image;
        if (!image) {
            return;
        }

        return (
            <View
                style={{
                    marginTop: 30,
                    width: 250,
                    borderRadius: 3,
                    elevation: 2,
                }}>
                <View
                    style={{
                        borderTopRightRadius: 3,
                        borderTopLeftRadius: 3,
                        shadowColor: 'rgba(0,0,0,1)',
                        shadowOpacity: 0.2,
                        shadowOffset: {width: 4, height: 4},
                        shadowRadius: 5,
                        overflow: 'hidden',
                    }}>
                    <Image source={{uri: image}} style={{width: 250, height: 250}}/>
                </View>

                <Text
                    style={{paddingVertical: 10, paddingHorizontal: 10}}>
                    {image}
                </Text>
            </View>
        );
    };

    _takePhoto = async () => {
        let pickerResult = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
        });

        this._handleImagePicked(pickerResult);
    };

    _pickImage = async () => {
        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
        });

        this._handleImagePicked(pickerResult);
    };

    _handleImagePicked = async pickerResult => {
        try {
            this.setState({uploading: true});
            if (!pickerResult.cancelled) {
                let uploadUrl = await uploadImageAsync(pickerResult.uri);
                this.setState({image: uploadUrl});
            }
        } catch (e) {
            console.log(e);
            alert('Upload failed, sorry :(');
        } finally {
            this.setState({uploading: false});
        }
    };
}

async function uploadImageAsync(uri) {
    // Why are we using XMLHttpRequest? See:
    // https://github.com/expo/expo/issues/2402#issuecomment-443726662
    const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(xhr.response);
        };
        xhr.onerror = function (e) {
            console.log(e);
            reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
    });

    const ref = firebase
        .storage()
        .ref()
        .child(uuid.v4());
    const snapshot = await ref.put(blob);

    // We're done with the blob, close and release it
    blob.close();

    let url = await snapshot.ref.getDownloadURL();
    console.log("Вот такой фот урл получился! ", url)
    return url;
}
