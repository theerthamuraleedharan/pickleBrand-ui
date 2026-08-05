import {
  useEffect,
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

      const updated = await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? "",
      });

      setProfile(updated);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
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

      const updated =
        await uploadProfilePhoto(file);

      setProfile(updated);
      await loadPhoto();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      event.target.value = "";
    }
  }

  async function handleAddressSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setErrorMessage(null);

      await createAddress(addressForm);

      setAddressForm(emptyAddress);
      setAddresses(await getAddresses());
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  }

  async function handleDeleteAddress(
    addressId: number
  ) {
    await deleteAddress(addressId);
    setAddresses(await getAddresses());
  }

  if (loading || !profile) {
    return (
      <main className="p-8">
        Loading profile...
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
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
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
                Upload photo

                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handlePhotoChange}
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

            <button className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white sm:col-span-2">
              Save profile
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold">
            Delivery addresses
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
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

                <button
                  type="button"
                  onClick={() =>
                    void handleDeleteAddress(
                      address.id
                    )
                  }
                  className="mt-4 text-sm font-semibold text-red-600"
                >
                  Delete
                </button>
              </article>
            ))}
          </div>

          <form
            onSubmit={handleAddressSubmit}
            className="mt-8 grid gap-4 sm:grid-cols-2"
          >
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

            <button className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white sm:col-span-2">
              Add address
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}