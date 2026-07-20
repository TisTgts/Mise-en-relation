import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Field } from './ui';
import StarRating from './StarRating';
import { colors, radii, spacing } from '../config/theme';

export default function ReviewModal({ visible, onClose, onSubmit, loading, partnerName }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    await onSubmit?.({ rating, comment: comment.trim() });
    setRating(5);
    setComment('');
  };

  const handleClose = () => {
    setRating(5);
    setComment('');
    onClose?.();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Laisser un avis</Text>
          <Text style={styles.subtitle}>
            {partnerName ? `Votre expérience avec ${partnerName}` : 'Votre expérience'}
          </Text>

          <Text style={styles.label}>Note</Text>
          <StarRating value={rating} onChange={setRating} size={28} />

          <Field
            label="Commentaire (optionnel)"
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Qualité, délais, communication…"
          />

          <Button title="Publier l'avis" onPress={handleSubmit} loading={loading} icon="star-outline" />
          <Button title="Annuler" variant="ghost" onPress={handleClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: spacing.md,
    color: colors.textMuted,
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
