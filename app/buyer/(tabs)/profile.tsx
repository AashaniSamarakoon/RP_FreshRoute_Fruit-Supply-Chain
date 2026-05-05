import Header from "@/components/Header";
import DigitalPassportModal from "@/components/modals/DigitalPassportModal";
import { BuyerColors } from "@/constants/theme";
import api from "@/services/api";
import { logger } from "@/utils/logger";
import {
  DEFAULT_BUYER_PREFERENCES,
  getBuyerPreferences,
  saveBuyerPreferences,
  type BuyerPreferences,
} from "@/utils/buyerPreferences";
import { supabase } from "@/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Edit3,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type BuyerProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  taxTin: string;
};

type DeliveryAddress = {
  id: string;
  label: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
};

type PaymentMethod = {
  id: string;
  brand: string;
  holderName: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
};

type Sheet = "personal" | "addresses" | "payments" | "preferences" | null;

const ADDRESS_STORAGE_KEY = "buyer_delivery_addresses";
const PAYMENT_STORAGE_KEY = "buyer_payment_methods";

const initialProfile: BuyerProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  taxTin: "",
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const maskCardNumber = (value: string) => value.replace(/\D/g, "").slice(-4);

export default function BuyerProfile() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSheet, setActiveSheet] = useState<Sheet>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<BuyerProfileForm>(initialProfile);
  const [profileDraft, setProfileDraft] = useState<BuyerProfileForm>(initialProfile);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [addressDraft, setAddressDraft] = useState<DeliveryAddress>({
    id: "",
    label: "",
    address: "",
    latitude: null,
    longitude: null,
    isDefault: false,
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [paymentDraft, setPaymentDraft] = useState({
    holderName: "",
    brand: "Visa",
    cardNumber: "",
    expiry: "",
  });
  const [preferences, setPreferences] =
    useState<BuyerPreferences>(DEFAULT_BUYER_PREFERENCES);

  const [certModalVisible, setCertModalVisible] = useState(false);
  const [passportData, setPassportData] = useState<any | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);

  const displayName = useMemo(() => {
    const name = `${profile.firstName} ${profile.lastName}`.trim();
    return name || profile.companyName || profile.email?.split("@")[0] || "Buyer";
  }, [profile]);

  const defaultAddress = addresses.find((item) => item.isDefault) ?? addresses[0];
  const defaultPayment = payments.find((item) => item.isDefault) ?? payments[0];

  const loadStoredProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const [userResult, buyerResult, savedAddresses, savedPayments, savedPrefs] =
        await Promise.all([
          supabase
            .from("users")
            .select("first_name,last_name,email,phone")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("buyers")
            .select("company_name,tax_tin_number,location,latitude,longitude")
            .eq("user_id", user.id)
            .maybeSingle(),
          AsyncStorage.getItem(ADDRESS_STORAGE_KEY),
          AsyncStorage.getItem(PAYMENT_STORAGE_KEY),
          getBuyerPreferences(),
        ]);

      const userData = userResult.data;
      const buyerData = buyerResult.data;

      const nextProfile: BuyerProfileForm = {
        firstName:
          userData?.first_name ??
          user.user_metadata?.first_name ??
          user.user_metadata?.full_name?.split(" ")?.[0] ??
          "",
        lastName:
          userData?.last_name ??
          user.user_metadata?.last_name ??
          user.user_metadata?.full_name?.split(" ")?.slice(1).join(" ") ??
          "",
        email: userData?.email ?? user.email ?? "",
        phone: userData?.phone ?? user.phone ?? "",
        companyName: buyerData?.company_name ?? "",
        taxTin: buyerData?.tax_tin_number ?? "",
      };

      setProfile(nextProfile);
      setProfileDraft(nextProfile);

      const parsedAddresses: DeliveryAddress[] = savedAddresses
        ? JSON.parse(savedAddresses)
        : [];
      if (parsedAddresses.length > 0) {
        setAddresses(parsedAddresses);
      } else if (buyerData?.location) {
        setAddresses([
          {
            id: newId(),
            label: "Primary delivery address",
            address: buyerData.location,
            latitude: buyerData.latitude ?? null,
            longitude: buyerData.longitude ?? null,
            isDefault: true,
          },
        ]);
      } else {
        setAddresses([]);
      }

      setPayments(savedPayments ? JSON.parse(savedPayments) : []);
      setPreferences(savedPrefs);
    } catch (error) {
      Alert.alert(
        "Profile unavailable",
        error instanceof Error ? error.message : "Could not load your profile.",
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [router]);

  useEffect(() => {
    loadStoredProfile();
  }, [loadStoredProfile]);

  const persistAddresses = async (next: DeliveryAddress[]) => {
    setAddresses(next);
    await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(next));
  };

  const persistPayments = async (next: PaymentMethod[]) => {
    setPayments(next);
    await AsyncStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(next));
  };

  const persistPreferences = async (next: BuyerPreferences) => {
    setPreferences(next);
    await saveBuyerPreferences(next);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStoredProfile();
    setRefreshing(false);
  };

  const openSheet = (sheet: Sheet) => {
    if (sheet === "personal") setProfileDraft(profile);
    if (sheet === "addresses") resetAddressDraft();
    if (sheet === "payments") resetPaymentDraft();
    setActiveSheet(sheet);
  };

  const closeSheet = () => {
    setActiveSheet(null);
    resetAddressDraft();
    resetPaymentDraft();
  };

  const saveProfile = async () => {
    if (!userId) return;
    if (!profileDraft.firstName.trim() || !profileDraft.email.trim()) {
      Alert.alert("Missing information", "Name and email are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        first_name: profileDraft.firstName.trim(),
        last_name: profileDraft.lastName.trim(),
        email: profileDraft.email.trim(),
        phone: profileDraft.phone.trim(),
      };

      const { error: userError } = await supabase
        .from("users")
        .update(payload)
        .eq("id", userId);
      if (userError) throw userError;

       const { error: metadataError } = await supabase.auth.updateUser({
         data: {
           first_name: payload.first_name,
           last_name: payload.last_name,
           full_name: `${payload.first_name} ${payload.last_name}`.trim(),
           phone: payload.phone,
         },
       });
       if (metadataError) logger.warn("Auth metadata update failed", metadataError);

       const { error: buyerError } = await supabase
         .from("buyers")
         .update({
           company_name: profileDraft.companyName.trim(),
           tax_tin_number: profileDraft.taxTin.trim(),
         })
         .eq("user_id", userId);
       if (buyerError) logger.warn("Buyer business update failed", buyerError);

      setProfile(profileDraft);
      Alert.alert("Profile updated", "Your account details have been saved.");
      closeSheet();
    } catch (error) {
      Alert.alert(
        "Could not save profile",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetAddressDraft = () => {
    setEditingAddressId(null);
    setAddressDraft({
      id: "",
      label: "",
      address: "",
      latitude: null,
      longitude: null,
      isDefault: addresses.length === 0,
    });
  };

  const editAddress = (address: DeliveryAddress) => {
    setEditingAddressId(address.id);
    setAddressDraft(address);
  };

  const saveAddress = async () => {
    if (!addressDraft.label.trim() || !addressDraft.address.trim()) {
      Alert.alert("Missing address", "Add a label and delivery address.");
      return;
    }

    const normalized: DeliveryAddress = {
      ...addressDraft,
      id: editingAddressId ?? newId(),
      label: addressDraft.label.trim(),
      address: addressDraft.address.trim(),
      isDefault: addressDraft.isDefault || addresses.length === 0,
    };

    let next = editingAddressId
      ? addresses.map((item) => (item.id === editingAddressId ? normalized : item))
      : [...addresses, normalized];

    if (normalized.isDefault) {
      next = next.map((item) => ({
        ...item,
        isDefault: item.id === normalized.id,
      }));
      if (userId) {
        const { error } = await supabase
          .from("buyers")
          .update({
            location: normalized.address,
            latitude: normalized.latitude ?? null,
            longitude: normalized.longitude ?? null,
          })
          .eq("user_id", userId);
         if (error) logger.warn("Default address sync failed", error);
      }
    }

    await persistAddresses(next);
    resetAddressDraft();
  };

  const setDefaultAddress = async (id: string) => {
    const selected = addresses.find((item) => item.id === id);
    if (!selected) return;
    const next = addresses.map((item) => ({ ...item, isDefault: item.id === id }));
    await persistAddresses(next);
    if (userId) {
      const { error } = await supabase
        .from("buyers")
        .update({
          location: selected.address,
          latitude: selected.latitude ?? null,
          longitude: selected.longitude ?? null,
        })
        .eq("user_id", userId);
         if (error) logger.warn("Default address sync failed", error);
    }
  };

  const deleteAddress = async (id: string) => {
    const remaining = addresses.filter((item) => item.id !== id);
    const removedDefault = addresses.find((item) => item.id === id)?.isDefault;
    const next =
      removedDefault && remaining.length > 0
        ? remaining.map((item, index) => ({ ...item, isDefault: index === 0 }))
        : remaining;
    await persistAddresses(next);
  };

  const resetPaymentDraft = () => {
    setPaymentDraft({
      holderName: "",
      brand: "Visa",
      cardNumber: "",
      expiry: "",
    });
  };

  const savePayment = async () => {
    const last4 = maskCardNumber(paymentDraft.cardNumber);
    if (!paymentDraft.holderName.trim() || last4.length !== 4 || !paymentDraft.expiry.trim()) {
      Alert.alert(
        "Card details incomplete",
        "Enter a cardholder name, card number, and expiry.",
      );
      return;
    }

    const method: PaymentMethod = {
      id: newId(),
      holderName: paymentDraft.holderName.trim(),
      brand: paymentDraft.brand.trim() || "Card",
      last4,
      expiry: paymentDraft.expiry.trim(),
      isDefault: payments.length === 0,
    };

    await persistPayments([...payments, method]);
    resetPaymentDraft();
  };

  const setDefaultPayment = async (id: string) => {
    await persistPayments(
      payments.map((item) => ({ ...item, isDefault: item.id === id })),
    );
  };

  const deletePayment = async (id: string) => {
    const remaining = payments.filter((item) => item.id !== id);
    const removedDefault = payments.find((item) => item.id === id)?.isDefault;
    const next =
      removedDefault && remaining.length > 0
        ? remaining.map((item, index) => ({ ...item, isDefault: index === 0 }))
        : remaining;
    await persistPayments(next);
  };

  const togglePreference = async (key: keyof BuyerPreferences) => {
    await persistPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleViewCertificate = async () => {
    if (!userId) return;
    setLoadingCert(true);
    setCertModalVisible(true);
    try {
      const data = await api.get(`/api/trust/test-identity/${userId}`);
      if (data.success) {
        setPassportData(data.digitalPassport);
      } else {
        throw new Error("ID not found");
      }
     } catch (error) {
       logger.warn("Certificate fetch failed, showing placeholder", error);
       setPassportData({
         serialNumber: "FR-8892-4B2A-9011",
         issuer: "FreshRoute Root CA",
         subject: displayName || "Verified Buyer",
         validFrom: new Date().toLocaleDateString("en-US", {
           month: "short",
           day: "2-digit",
           year: "numeric",
         }),
         validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
           .toLocaleDateString("en-US", {
             month: "short",
             day: "2-digit",
             year: "numeric",
           }),
         fingerprint: "A2:4F:99:B1:0C:E3",
       });
     } finally {
       setLoadingCert(false);
     }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
     } catch (error) {
       logger.warn("Supabase signOut failed", error);
     }
    await AsyncStorage.multiRemove([
      "token",
      "user",
      "onboarded",
      "onboarding_buyer",
    ]);
    router.replace("/login");
  };

  const MenuOption = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    isDestructive = false,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    isDestructive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.menuIconBox,
          isDestructive && styles.menuIconBoxDestructive,
        ]}
      >
        <Icon size={20} color={isDestructive ? "#DC2626" : "#4B5563"} />
      </View>
      <View style={styles.menuTextContent}>
        <Text
          style={[
            styles.menuTitle,
            isDestructive && styles.menuTitleDestructive,
          ]}
        >
          {title}
        </Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <ChevronRight size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const SummaryCard = ({
    icon: Icon,
    title,
    value,
    meta,
    onPress,
  }: {
    icon: any;
    title: string;
    value: string;
    meta: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.summaryCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.summaryIcon}>
        <Icon size={20} color={BuyerColors.primaryGreen} />
      </View>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryLabel}>{title}</Text>
        <Text style={styles.summaryValue} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.summaryMeta}>{meta}</Text>
      </View>
      <ChevronRight size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title="Account" showNotification />
        <View style={styles.loadingState}>
          <ActivityIndicator color={BuyerColors.primaryGreen} size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Account"
        showNotification
        onNotificationPress={() => openSheet("preferences")}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BuyerColors.primaryGreen]}
            tintColor={BuyerColors.primaryGreen}
          />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userIdSmall} numberOfLines={1}>
              {profile.email || userId}
            </Text>
            <View style={styles.badgeRow}>
              <ShieldCheck size={14} color={BuyerColors.primaryGreen} />
              <Text style={styles.verifiedText}>Verified Buyer</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.headerEditButton}
            onPress={() => openSheet("personal")}
            activeOpacity={0.8}
          >
            <Edit3 size={18} color={BuyerColors.primaryGreen} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          <SummaryCard
            icon={MapPin}
            title="Delivery"
            value={defaultAddress?.label ?? "No address saved"}
            meta={defaultAddress?.address ?? "Add a default delivery address"}
            onPress={() => openSheet("addresses")}
          />
          <SummaryCard
            icon={CreditCard}
            title="Payment"
            value={
              defaultPayment
                ? `${defaultPayment.brand} ending ${defaultPayment.last4}`
                : "No card saved"
            }
            meta={
              defaultPayment
                ? `Default method · Expires ${defaultPayment.expiry}`
                : "Add a payment method"
            }
            onPress={() => openSheet("payments")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Trust & Security</Text>
          <TouchableOpacity
            style={styles.certificateCard}
            onPress={handleViewCertificate}
            activeOpacity={0.8}
          >
            <View style={styles.certIconBg}>
              <CheckCircle2 size={24} color={BuyerColors.primaryGreen} />
            </View>
            <View style={styles.certTextContent}>
              <Text style={styles.certTitle}>Digital Passport</Text>
              <Text style={styles.certSubtitle}>View your cryptographic identity</Text>
            </View>
            {loadingCert ? (
              <ActivityIndicator color={BuyerColors.primaryGreen} />
            ) : (
              <ChevronRight size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account Settings</Text>
          <View style={styles.menuCard}>
            <MenuOption
              icon={User}
              title="Personal Information"
              subtitle={`${profile.phone || "No phone added"} · ${profile.companyName || "No company"}`}
              onPress={() => openSheet("personal")}
            />
            <View style={styles.menuDivider} />
            <MenuOption
              icon={MapPin}
              title="Delivery Addresses"
              subtitle={`${addresses.length} saved address${addresses.length === 1 ? "" : "es"}`}
              onPress={() => openSheet("addresses")}
            />
            <View style={styles.menuDivider} />
            <MenuOption
              icon={CreditCard}
              title="Payment Methods"
              subtitle={`${payments.length} saved method${payments.length === 1 ? "" : "s"}`}
              onPress={() => openSheet("payments")}
            />
            <View style={styles.menuDivider} />
            <MenuOption
              icon={Bell}
              title="Preferences"
              subtitle="Notifications, alerts, and privacy"
              onPress={() => openSheet("preferences")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Support</Text>
          <View style={styles.menuCard}>
            <MenuOption
              icon={LifeBuoy}
              title="Help Center"
              subtitle="FAQs and FreshRoute support"
              onPress={() => Alert.alert("Help Center", "Support will be available here.")}
            />
            <View style={styles.menuDivider} />
            <MenuOption
              icon={LogOut}
              title="Sign Out"
              isDestructive
              onPress={handleLogout}
            />
          </View>
        </View>

        <Text style={styles.versionText}>FreshRoute v1.0.0</Text>
      </ScrollView>

      <ProfileSheet
        visible={activeSheet === "personal"}
        title="Personal Information"
        onClose={closeSheet}
      >
        <FormInput
          label="First name"
          value={profileDraft.firstName}
          onChangeText={(value) =>
            setProfileDraft((prev) => ({ ...prev, firstName: value }))
          }
          icon={User}
        />
        <FormInput
          label="Last name"
          value={profileDraft.lastName}
          onChangeText={(value) =>
            setProfileDraft((prev) => ({ ...prev, lastName: value }))
          }
          icon={User}
        />
        <FormInput
          label="Email"
          value={profileDraft.email}
          onChangeText={(value) =>
            setProfileDraft((prev) => ({ ...prev, email: value }))
          }
          keyboardType="email-address"
          icon={Mail}
        />
        <FormInput
          label="Phone"
          value={profileDraft.phone}
          onChangeText={(value) =>
            setProfileDraft((prev) => ({ ...prev, phone: value }))
          }
          keyboardType="phone-pad"
          icon={Phone}
        />
        <FormInput
          label="Company"
          value={profileDraft.companyName}
          onChangeText={(value) =>
            setProfileDraft((prev) => ({ ...prev, companyName: value }))
          }
          icon={Building2}
        />
        <FormInput
          label="Tax TIN"
          value={profileDraft.taxTin}
          onChangeText={(value) =>
            setProfileDraft((prev) => ({ ...prev, taxTin: value }))
          }
          icon={ShieldCheck}
        />
        <PrimaryButton
          label={saving ? "Saving..." : "Save changes"}
          onPress={saveProfile}
          disabled={saving}
          loading={saving}
        />
      </ProfileSheet>

      <ProfileSheet
        visible={activeSheet === "addresses"}
        title="Delivery Addresses"
        onClose={closeSheet}
      >
        {addresses.length === 0 ? (
          <EmptyPanel
            icon={MapPin}
            title="No delivery addresses"
            text="Add a default address to speed up future orders."
          />
        ) : (
          addresses.map((item) => (
            <ManagedCard key={item.id}>
              <View style={styles.managedMain}>
                <Text style={styles.managedTitle}>{item.label}</Text>
                <Text style={styles.managedSubtitle}>{item.address}</Text>
                {item.isDefault ? (
                  <Text style={styles.defaultPill}>Default address</Text>
                ) : null}
              </View>
              <View style={styles.cardActions}>
                {!item.isDefault ? (
                  <TouchableOpacity
                    style={styles.smallTextButton}
                    onPress={() => setDefaultAddress(item.id)}
                  >
                    <Text style={styles.smallTextButtonLabel}>Set default</Text>
                  </TouchableOpacity>
                ) : null}
                <IconButton icon={Edit3} onPress={() => editAddress(item)} />
                <IconButton
                  icon={Trash2}
                  danger
                  onPress={() => deleteAddress(item.id)}
                />
              </View>
            </ManagedCard>
          ))
        )}

        <View style={styles.subForm}>
          <Text style={styles.subFormTitle}>
            {editingAddressId ? "Edit address" : "Add address"}
          </Text>
          <FormInput
            label="Label"
            value={addressDraft.label}
            onChangeText={(value) =>
              setAddressDraft((prev) => ({ ...prev, label: value }))
            }
            placeholder="Warehouse, Office, Home"
            icon={Navigation}
          />
          <FormInput
            label="Delivery address"
            value={addressDraft.address}
            onChangeText={(value) =>
              setAddressDraft((prev) => ({ ...prev, address: value }))
            }
            placeholder="Street, city, district"
            multiline
            icon={MapPin}
          />
          <ToggleRow
            icon={CheckCircle2}
            title="Use as default"
            subtitle="Orders will prefill this address"
            value={addressDraft.isDefault}
            onValueChange={() =>
              setAddressDraft((prev) => ({ ...prev, isDefault: !prev.isDefault }))
            }
          />
          <PrimaryButton
            label={editingAddressId ? "Update address" : "Add address"}
            onPress={saveAddress}
          />
        </View>
      </ProfileSheet>

      <ProfileSheet
        visible={activeSheet === "payments"}
        title="Payment Methods"
        onClose={closeSheet}
      >
        {payments.length === 0 ? (
          <EmptyPanel
            icon={CreditCard}
            title="No payment methods"
            text="Save card references for faster checkout. Full card numbers are not stored."
          />
        ) : (
          payments.map((item) => (
            <ManagedCard key={item.id}>
              <View style={styles.paymentIcon}>
                <CreditCard size={22} color={BuyerColors.primaryGreen} />
              </View>
              <View style={styles.managedMain}>
                <Text style={styles.managedTitle}>
                  {item.brand} ending {item.last4}
                </Text>
                <Text style={styles.managedSubtitle}>
                  {item.holderName} · Expires {item.expiry}
                </Text>
                {item.isDefault ? (
                  <Text style={styles.defaultPill}>Default payment</Text>
                ) : null}
              </View>
              <View style={styles.cardActions}>
                {!item.isDefault ? (
                  <TouchableOpacity
                    style={styles.smallTextButton}
                    onPress={() => setDefaultPayment(item.id)}
                  >
                    <Text style={styles.smallTextButtonLabel}>Set default</Text>
                  </TouchableOpacity>
                ) : null}
                <IconButton
                  icon={Trash2}
                  danger
                  onPress={() => deletePayment(item.id)}
                />
              </View>
            </ManagedCard>
          ))
        )}

        <View style={styles.subForm}>
          <Text style={styles.subFormTitle}>Add payment method</Text>
          <FormInput
            label="Cardholder name"
            value={paymentDraft.holderName}
            onChangeText={(value) =>
              setPaymentDraft((prev) => ({ ...prev, holderName: value }))
            }
            icon={User}
          />
          <FormInput
            label="Brand"
            value={paymentDraft.brand}
            onChangeText={(value) =>
              setPaymentDraft((prev) => ({ ...prev, brand: value }))
            }
            placeholder="Visa, Mastercard, Amex"
            icon={CreditCard}
          />
          <FormInput
            label="Card number"
            value={paymentDraft.cardNumber}
            onChangeText={(value) =>
              setPaymentDraft((prev) => ({ ...prev, cardNumber: value }))
            }
            keyboardType="number-pad"
            placeholder="Only last 4 digits are saved"
            icon={Lock}
          />
          <FormInput
            label="Expiry"
            value={paymentDraft.expiry}
            onChangeText={(value) =>
              setPaymentDraft((prev) => ({ ...prev, expiry: value }))
            }
            placeholder="MM/YY"
            icon={CreditCard}
          />
          <PrimaryButton label="Add payment method" onPress={savePayment} icon={Plus} />
        </View>
      </ProfileSheet>

      <ProfileSheet
        visible={activeSheet === "preferences"}
        title="Preferences"
        onClose={closeSheet}
      >
        <View style={styles.toggleCard}>
          <ToggleRow
            icon={Bell}
            title="Push notifications"
            subtitle="Allow FreshRoute app alerts"
            value={preferences.pushNotifications}
            onValueChange={() => togglePreference("pushNotifications")}
          />
          <View style={styles.menuDivider} />
          <ToggleRow
            icon={Navigation}
            title="Order updates"
            subtitle="Status changes and delivery movement"
            value={preferences.orderUpdates}
            onValueChange={() => togglePreference("orderUpdates")}
          />
          <View style={styles.menuDivider} />
          <ToggleRow
            icon={CreditCard}
            title="Payment alerts"
            subtitle="Payment verification and card authorization alerts"
            value={preferences.paymentAlerts}
            onValueChange={() => togglePreference("paymentAlerts")}
          />
          <View style={styles.menuDivider} />
          <ToggleRow
            icon={Bell}
            title="Market price alerts"
            subtitle="Daily FreshRoute price movement"
            value={preferences.marketPriceAlerts}
            onValueChange={() => togglePreference("marketPriceAlerts")}
          />
          <View style={styles.menuDivider} />
          <ToggleRow
            icon={CreditCard}
            title="Auto payment refresh"
            subtitle="Refresh payment verification screens automatically"
            value={preferences.autoPaymentReminders}
            onValueChange={() => togglePreference("autoPaymentReminders")}
          />
        </View>
      </ProfileSheet>

      <DigitalPassportModal
        visible={certModalVisible}
        onClose={() => setCertModalVisible(false)}
        loading={loadingCert}
        passportData={passportData}
      />
    </SafeAreaView>
  );
}

function ProfileSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetOverlay}
      >
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color="#475569" />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  multiline?: boolean;
  icon: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputShell, multiline && styles.inputShellMultiline]}>
        <Icon size={18} color="#64748B" style={styles.inputIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
      </View>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  icon: Icon = Save,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Icon size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: any;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: () => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>
        <Icon size={18} color={BuyerColors.primaryGreen} />
      </View>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#D1D5DB", true: "#A7F3D0" }}
        thumbColor={value ? BuyerColors.primaryGreen : "#F8FAFC"}
      />
    </View>
  );
}

function ManagedCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.managedCard}>{children}</View>;
}

function IconButton({
  icon: Icon,
  onPress,
  danger,
}: {
  icon: any;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.iconButton, danger && styles.iconButtonDanger]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Icon size={16} color={danger ? "#DC2626" : "#475569"} />
    </TouchableOpacity>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.emptyPanel}>
      <Icon size={30} color="#94A3B8" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BuyerColors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: BuyerColors.textGray,
    fontWeight: "600",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: BuyerColors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    fontSize: 25,
    fontWeight: "800",
    color: BuyerColors.primaryGreen,
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: BuyerColors.textBlack,
    marginBottom: 4,
  },
  userIdSmall: {
    fontSize: 12,
    color: BuyerColors.textGray,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  headerEditButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BuyerColors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  quickGrid: {
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BuyerColors.border,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: BuyerColors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: BuyerColors.textGray,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summaryValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "800",
    color: BuyerColors.textBlack,
  },
  summaryMeta: {
    marginTop: 2,
    fontSize: 12,
    color: BuyerColors.textGray,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  certificateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BuyerColors.border,
  },
  certIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BuyerColors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  certTextContent: {
    flex: 1,
  },
  certTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: BuyerColors.textBlack,
  },
  certSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: BuyerColors.textGray,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BuyerColors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuIconBoxDestructive: {
    backgroundColor: "#FEF2F2",
  },
  menuTextContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BuyerColors.textBlack,
  },
  menuTitleDestructive: {
    color: "#DC2626",
  },
  menuSubtitle: {
    fontSize: 13,
    color: BuyerColors.textGray,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 64,
  },
  versionText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: BuyerColors.textBlack,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetContent: {
    padding: 20,
    paddingBottom: 34,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 7,
  },
  inputShell: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: BuyerColors.border,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
  },
  inputShellMultiline: {
    minHeight: 92,
    alignItems: "flex-start",
    paddingTop: 14,
  },
  inputIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: BuyerColors.textBlack,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 68,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: BuyerColors.primaryGreen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  managedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 10,
  },
  managedMain: {
    flex: 1,
  },
  managedTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: BuyerColors.textBlack,
  },
  managedSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: BuyerColors.textGray,
    lineHeight: 18,
  },
  defaultPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    color: "#065F46",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "800",
  },
  cardActions: {
    alignItems: "flex-end",
    gap: 8,
    marginLeft: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonDanger: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  smallTextButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  smallTextButtonLabel: {
    color: BuyerColors.primaryGreen,
    fontSize: 12,
    fontWeight: "800",
  },
  subForm: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  subFormTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: BuyerColors.textBlack,
    marginBottom: 12,
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: BuyerColors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toggleCard: {
    borderWidth: 1,
    borderColor: BuyerColors.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BuyerColors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toggleText: {
    flex: 1,
    paddingRight: 10,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: BuyerColors.textBlack,
  },
  toggleSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: BuyerColors.textGray,
    lineHeight: 17,
  },
  emptyPanel: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "900",
    color: BuyerColors.textBlack,
  },
  emptyText: {
    marginTop: 5,
    fontSize: 13,
    color: BuyerColors.textGray,
    textAlign: "center",
    lineHeight: 19,
  },
});
