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
    void loadPage();

    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, []);

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
      <main className="p-8">
        Loading profile...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-amber-50 px-6 py-10">
        <div className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
          {errorMessage ?? "We couldn't load your profile. Please try again."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-4xl font-black text-gray-900">
            My profile
          </h1>

          <p className="mt-2 text-gray-600">
            Manage your personal information and
            delivery addresses.
          </p>
        </header>

        {errorMessage && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-800">
            {successMessage}
          </div>
        )}

        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-emerald-100">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-black text-emerald-800">
                  {profile.firstName.charAt(0)}
                  {profile.lastName.charAt(0)}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Profile photo
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                PNG or JPEG, maximum 2 MB.
              </p>

              <label className="mt-4 inline-block cursor-pointer rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900">
                {uploadingPhoto ? "Uploading photo..." : "Upload photo"}

                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <form
            onSubmit={handleProfileSubmit}
            className="mt-8 grid gap-5 sm:grid-cols-2"
          >
            <input
              value={profile.firstName}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  firstName: event.target.value,
                })
              }
              placeholder="First name"
              className="rounded-xl border px-4 py-3"
            />

            <input
              value={profile.lastName}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  lastName: event.target.value,
                })
              }
              placeholder="Last name"
              className="rounded-xl border px-4 py-3"
            />

            <input
              value={profile.email}
              readOnly
              className="rounded-xl border bg-gray-100 px-4 py-3 text-gray-500"
            />

            <input
              value={profile.phone ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  phone: event.target.value,
                })
              }
              placeholder="Phone"
              className="rounded-xl border px-4 py-3"
            />

            <button type="submit" disabled={saving} className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold">
            Delivery addresses
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {addresses.length === 0 && (
              <p className="rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-600 md:col-span-2">
                You haven't saved a delivery address yet. Add one below to make checkout quicker.
              </p>
            )}
            {addresses.map((address) => (
              <article
                key={address.id}
                className="rounded-2xl border p-5"
              >
                <div className="flex justify-between gap-4">
                  <h3 className="font-bold">
                    {address.recipientName}
                  </h3>

                  {address.defaultAddress && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      Default
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {address.addressLine1}
                  <br />

                  {address.addressLine2 && (
                    <>
                      {address.addressLine2}
                      <br />
                    </>
                  )}

                  {address.postalCode} {address.city}
                  <br />

                  {address.state && (
                    <>
                      {address.state}
                      <br />
                    </>
                  )}

                  {address.country}
                  <br />

                  {address.phone}
                </p>

                <div className="mt-4 flex gap-4">
                  <button
                    type="button"
                    disabled={savingAddress || deletingAddressId !== null}
                    onClick={() => handleEditAddress(address)}
                    className="text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={
                      deletingAddressId === address.id || savingAddress
                    }
                    onClick={() => void handleDeleteAddress(address.id)}
                    className="text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingAddressId === address.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <form
            ref={addressFormRef}
            onSubmit={handleAddressSubmit}
            className="mt-8 grid gap-4 sm:grid-cols-2"
          >
            <h3 className="text-lg font-bold sm:col-span-2">
              {editingAddressId === null ? "Add a delivery address" : "Edit delivery address"}
            </h3>
            {[
              ["recipientName", "Recipient name"],
              ["phone", "Phone"],
              ["addressLine1", "Address line 1"],
              ["addressLine2", "Address line 2"],
              ["city", "City"],
              ["state", "State"],
              ["postalCode", "Postal code"],
              ["country", "Country"],
            ].map(([field, placeholder]) => (
              <input
                key={field}
                value={
                  addressForm[
                    field as keyof AddressRequest
                  ] as string
                }
                onChange={(event) =>
                  setAddressForm({
                    ...addressForm,
                    [field]: event.target.value,
                  })
                }
                placeholder={placeholder}
                required={
                  ![
                    "addressLine2",
                    "state",
                  ].includes(field)
                }
                className="rounded-xl border px-4 py-3"
              />
            ))}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  addressForm.defaultAddress
                }
                onChange={(event) =>
                  setAddressForm({
                    ...addressForm,
                    defaultAddress:
                      event.target.checked,
                  })
                }
              />

              Make this my default address
            </label>

            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
              <button
                type="submit"
                disabled={savingAddress}
                className="flex-1 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAddress
                  ? editingAddressId === null
                    ? "Saving address..."
                    : "Updating address..."
                  : editingAddressId === null
                    ? "Add address"
                    : "Save address changes"}
              </button>
              {editingAddressId !== null && (
                <button
                  type="button"
                  disabled={savingAddress}
                  onClick={cancelAddressEdit}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}