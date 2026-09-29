import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  createAddress,
  deleteAddress,
  getAddresses,
  getProfile,
  getProfilePhoto,
  updateProfile,
  updateAddress,
  uploadProfilePhoto,
} from "../api/profileApi";

import { Header } from "../components/layout/Header";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import type {
  Address,
  AddressRequest,
  UserProfile,
} from "../types/Profile";

const emptyAddress: AddressRequest = {
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Germany",
  defaultAddress: false,
};

export function UserProfilePage() {
  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [photoUrl, setPhotoUrl] =
    useState<string | null>(null);

  const [addressForm, setAddressForm] =
    useState<AddressRequest>(emptyAddress);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] =
    useState<number | null>(null);
  const [deletingAddressId, setDeletingAddressId] =
    useState<number | null>(null);
  const addressFormRef = useRef<HTMLFormElement>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);

        const [profileResult, addressResult] =
          await Promise.all([
            getProfile(),
            getAddresses(),
          ]);

        setProfile(profileResult);
        setAddresses(addressResult);

        if (profileResult.hasProfilePhoto) {
          await loadPhoto();
        }
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    void loadPage();
  }, []);

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  async function loadPhoto() {
    const blob = await getProfilePhoto();
    const url = URL.createObjectURL(blob);

    setPhotoUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return url;
    });
  }

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!profile) {
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      setSaving(true);
      const updated = await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? "",
      });

      setProfile(updated);
      setSuccessMessage("Your profile has been saved.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
      setSuccessMessage(null);
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setUploadingPhoto(true);

      const updated =
        await uploadProfilePhoto(file);

      setProfile(updated);
      await loadPhoto();
      setSuccessMessage("Your profile photo has been saved.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  }

  async function handleAddressSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setSavingAddress(true);

      if (editingAddressId !== null) {
        const updatedAddress = await updateAddress(
          editingAddressId,
          addressForm,
        );
        setAddresses((currentAddresses) =>
          currentAddresses.map((address) => {
            if (address.id === updatedAddress.id) return updatedAddress;
            return updatedAddress.defaultAddress
              ? { ...address, defaultAddress: false }
              : address;
          }),
        );
        setSuccessMessage("Your delivery address has been updated.");
      } else {
        const createdAddress = await createAddress(addressForm);
        setAddresses((currentAddresses) => [
          ...currentAddresses.map((address) => ({
            ...address,
            defaultAddress: createdAddress.defaultAddress
              ? false
              : address.defaultAddress,
          })),
          createdAddress,
        ]);
        setSuccessMessage("Your delivery address has been saved.");
      }

      setAddressForm(emptyAddress);
      setEditingAddressId(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
      setSuccessMessage(null);
    } finally {
      setSavingAddress(false);
    }
  }

  function handleEditAddress(address: Address) {
    setEditingAddressId(address.id);
    setAddressForm({
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      city: address.city,
      state: address.state ?? "",
      postalCode: address.postalCode,
      country: address.country,
      defaultAddress: address.defaultAddress,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    addressFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function cancelAddressEdit() {
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleDeleteAddress(
    addressId: number
  ) {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setDeletingAddressId(addressId);
      await deleteAddress(addressId);
      if (editingAddressId === addressId) {
        setEditingAddressId(null);
        setAddressForm(emptyAddress);
      }
      setAddresses((currentAddresses) => {
        const removedAddress = currentAddresses.find(
          (address) => address.id === addressId,
        );
        const remaining = currentAddresses.filter(
          (address) => address.id !== addressId,
        );
        if (removedAddress?.defaultAddress && remaining.length > 0) {
          remaining[0] = { ...remaining[0], defaultAddress: true };
        }
        return remaining;
      });
      setSuccessMessage("The delivery address has been deleted.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
      setSuccessMessage(null);
    } finally {
      setDeletingAddressId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="animate-pulse space-y-6" role="status" aria-label="Loading profile">
            <div className="h-10 w-56 rounded-lg bg-slate-200" />
            <div className="h-44 rounded-3xl bg-white shadow-sm" />
            <div className="h-72 rounded-3xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto max-w-6xl space-y-7 px-5 py-8 sm:px-8 sm:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">Your account</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Profile &amp; addresses
            </h1>
            <p className="mt-2 max-w-xl text-base leading-7 text-slate-600">
              Keep your contact details and delivery information up to date.
            </p>
          </div>
          {profile && (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
              Customer account
            </div>
          )}
        </header>

        {errorMessage && profile && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-900">
            {successMessage}
          </div>
        )}

        {!profile ? (
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-red-800 shadow-sm" role="alert">
            {errorMessage ?? "We couldn't load your profile. Please try again."}
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-3xl bg-emerald-950 p-6 text-white shadow-lg shadow-emerald-950/10 sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border border-white/10 bg-emerald-800/40" aria-hidden="true" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white/10 text-3xl font-black text-amber-200 ring-1 ring-white/20 sm:h-28 sm:w-28">
                  {photoUrl ? (
                    <img src={photoUrl} alt={`${profile.firstName} ${profile.lastName}`} className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden="true">
                      {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-emerald-200">Welcome to your account</p>
                  <h2 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="mt-1 truncate text-sm text-emerald-100 sm:text-base">{profile.email}</p>
                </div>
                <div className="relative">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 focus-within:ring-2 focus-within:ring-amber-300">
                    {uploadingPhoto ? "Uploading photo..." : photoUrl ? "Change photo" : "Add a photo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handlePhotoChange}
                      disabled={uploadingPhoto}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-2 text-xs text-emerald-200">PNG or JPEG · Max 2 MB</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col gap-1 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Personal information</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Your details</h2>
                </div>
                <p className="text-sm text-slate-500">Your email is used to sign in.</p>
              </div>
              <form onSubmit={handleProfileSubmit} className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">First name</span>
                  <input
                    value={profile.firstName}
                    onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
                    autoComplete="given-name"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Last name</span>
                  <input
                    value={profile.lastName}
                    onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
                    autoComplete="family-name"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    autoComplete="email"
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Phone number</span>
                  <input
                    type="tel"
                    value={profile.phone ?? ""}
                    onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                    autoComplete="tel"
                    placeholder="Add a phone number"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400"
                  />
                </label>
                <div className="flex justify-end border-t border-slate-100 pt-5 sm:col-span-2">
                  <button type="submit" disabled={saving} className="inline-flex min-w-40 items-center justify-center rounded-xl bg-emerald-950 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? "Saving details..." : "Save changes"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">For a smoother checkout</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Delivery addresses</h2>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  {addresses.length} {addresses.length === 1 ? "address" : "addresses"}
                </span>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {addresses.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center lg:col-span-2">
                    <p className="font-semibold text-slate-800">No saved addresses yet</p>
                    <p className="mt-1 text-sm text-slate-500">Add a delivery address below to make future orders easier.</p>
                  </div>
                )}
                {addresses.map((address) => (
                  <article key={address.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Deliver to</p>
                        <h3 className="mt-1 truncate text-base font-bold text-slate-950">{address.recipientName}</h3>
                      </div>
                      {address.defaultAddress && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100">Default</span>
                      )}
                    </div>
                    <address className="mt-4 border-l-2 border-emerald-200 pl-3 text-sm not-italic leading-6 text-slate-600">
                      {address.addressLine1}<br />
                      {address.addressLine2 && <>{address.addressLine2}<br /></>}
                      {address.postalCode} {address.city}<br />
                      {address.state && <>{address.state}<br /></>}
                      {address.country}<br />
                      <span className="text-slate-500">{address.phone}</span>
                    </address>
                    <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        disabled={savingAddress || deletingAddressId !== null}
                        onClick={() => handleEditAddress(address)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit address
                      </button>
                      <button
                        type="button"
                        disabled={deletingAddressId === address.id || savingAddress}
                        onClick={() => void handleDeleteAddress(address.id)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingAddressId === address.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <form ref={addressFormRef} onSubmit={handleAddressSubmit} className="mt-7 rounded-2xl bg-slate-50 p-5 sm:p-6">
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
                    {editingAddressId === null ? "New address" : "Update address"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">
                    {editingAddressId === null ? "Add a delivery address" : "Edit delivery address"}
                  </h3>
                </div>
                <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                  {[
                    ["recipientName", "Recipient name"],
                    ["phone", "Phone number"],
                    ["addressLine1", "Address line 1"],
                    ["addressLine2", "Address line 2 (optional)"],
                    ["city", "City"],
                    ["state", "State / region (optional)"],
                    ["postalCode", "Postal code"],
                    ["country", "Country"],
                  ].map(([field, label]) => (
                    <label key={field} className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
                      <input
                        value={addressForm[field as keyof AddressRequest] as string}
                        onChange={(event) => setAddressForm({ ...addressForm, [field]: event.target.value })}
                        autoComplete={field === "recipientName" ? "name" : field === "phone" ? "tel" : undefined}
                        required={!["addressLine2", "state"].includes(field)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={addressForm.defaultAddress}
                      onChange={(event) => setAddressForm({ ...addressForm, defaultAddress: event.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 accent-emerald-800"
                    />
                    Make this my default address
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {editingAddressId !== null && (
                      <button
                        type="button"
                        disabled={savingAddress}
                        onClick={cancelAddressEdit}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" disabled={savingAddress} className="rounded-xl bg-emerald-950 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                      {savingAddress
                        ? editingAddressId === null ? "Saving address..." : "Updating address..."
                        : editingAddressId === null ? "Add address" : "Save address changes"}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </>
        )}
      </div>
    </main>
  );
}