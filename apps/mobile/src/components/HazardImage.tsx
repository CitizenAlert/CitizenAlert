// components/HazardImage.js
import React, { useState, useEffect } from 'react';
import { Image, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const HazardImage = ({ imageUri, style, placeholderStyle, placeholderTextStyle }) => {
  const [resolvedUri, setResolvedUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (!imageUri) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(imageUri, {
          headers: { Accept: 'image/*, application/json' },
        });

        const contentType = response.headers.get('content-type') || '';

        // Handle redirect to MinIO presigned URL
        if (response.redirected) {
          setResolvedUri(response.url);
          return;
        }

        // Handle JSON response (presigned URL or base64)
        if (contentType.includes('application/json')) {
          const data = await response.json();

          const resolvedUrl =
            data.url ||
            data.imageUrl ||
            data.presignedUrl ||
            data.signedUrl ||
            data.data?.url;

          if (resolvedUrl) {
            setResolvedUri(resolvedUrl);
          } else if (data.base64) {
            setResolvedUri(`data:image/jpeg;base64,${data.base64}`);
          } else {
            throw new Error('No image URL in response: ' + JSON.stringify(data));
          }
          return;
        }

        // Handle direct image
        if (contentType.startsWith('image/')) {
          setResolvedUri(imageUri);
          return;
        }

        // Unknown content
        const text = await response.text();
        throw new Error(`Unexpected content-type: ${contentType}`);

      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [imageUri]);

  if (loading) {
    return (
      <View style={[style, placeholderStyle, localStyles.centered]}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  }

  if (fetchError || !resolvedUri) {
    return (
      <View style={[style, placeholderStyle]}>
        <Text style={placeholderTextStyle}>Aucune photo</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={style}
      resizeMode="cover"
    />
  );
};

const localStyles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HazardImage;