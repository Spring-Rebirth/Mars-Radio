import {
    View,
    Image,
    Text,
    ScrollView,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Link, router } from "expo-router";
import { getCurrentUser } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import images from "../../constants/images";
import CustomForm from "../../components/CustomForm";
import CustomButton from "../../components/CustomButton";
import { updatePushToken } from "../../functions/notifications/index";
import { useTranslation } from "react-i18next";
import { useSignIn, useUser } from "@clerk/clerk-expo";
import useLockPortrait from "../../hooks/useLockPortrait";

export default function SignIn() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { user } = useUser();
    const [form, setForm] = useState({ email: "", password: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false); // 新增状态控制页面跳转
    const { setUser, setIsLoggedIn } = useGlobalContext();
    const { t } = useTranslation();

    useLockPortrait();

    async function submit() {
        if (form.email === "" || form.password === "") {
            Alert.alert("Error", t("Please fill in all the fields!"));
            return;
        }

        setIsSubmitting(true);

        try {
            if (!isLoaded) return;

            try {
                const signInAttempt = await signIn.create({
                    identifier: form.email,
                    password: form.password,
                });

                if (signInAttempt.status === "complete") {
                    await setActive({ session: signInAttempt.createdSessionId });
                } else {
                    // See https://clerk.com/docs/custom-flows/error-handling
                    // for more info on error handling
                    console.error(JSON.stringify(signInAttempt, null, 2));
                }
            } catch (err) {
                console.error(JSON.stringify(err, null, 2));
                setIsSubmitting(false);
                Alert.alert(
                    t("Error"),
                    t(
                        "The account does not exist or the password is incorrect. Please check and try again."
                    )
                );
            }
        } catch (error) {
            Alert.alert("Error in submit", error.message);
            setIsSubmitting(false);
        }
    }

    useEffect(() => {
        const handleUserUpdate = async () => {
            if (user) {
                // 获取当前用户信息并更新状态
                const result = await getCurrentUser(user.id);
                if (result) setUser(result);
                console.log('use result:', JSON.stringify(result, null, 2));

                setIsLoggedIn(true);

                // 确保所有状态都已更新后再跳转页面
                setIsSubmitting(false);
                setIsTransitioning(true); // 标记进入跳转状态

                // 更新推送令牌
                await updatePushToken(result, result.expo_push_token)
                    .then(console.log('推送令牌更新成功'));

                setTimeout(() => {
                    router.replace("/home");
                }, 100); // 延迟 100 毫秒以确保状态同步完成
            }
        };
        handleUserUpdate();
    }, [user]);

    if (isSubmitting || isTransitioning) {
        return (
            <View className="flex-1 justify-center items-center bg-primary">
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <>
            <SafeAreaView className="bg-primary">
                <ScrollView contentContainerStyle={{ height: "100%" }}>
                    {__DEV__ && (
                        <TouchableOpacity
                            onPress={() => {
                                setIsTransitioning(true);
                                router.replace("/home");
                            }}
                            className="absolute top-4 right-4 z-50 bg-gray-100/50 px-3 py-1.5 rounded-lg border border-gray-200"
                        >
                            <Text className="text-xs font-semibold text-gray-700">
                                Dev: Skip
                            </Text>
                        </TouchableOpacity>
                    )}
                    <View className="h-full justify-center px-6">
                        <View className="h-[85vh] justify-center">
                            <View className="flex-row items-center space-x-2">
                                <Image
                                    source={images.logoSmall}
                                    resizeMode="contain"
                                    className="w-9 h-10"
                                />
                                <Text className="text-black text-4xl font-semibold">
                                    Mars Radio
                                </Text>
                            </View>

                            <Text className="text-black text-2xl font-psemibold mt-6">
                                {t("Sign in")}
                            </Text>

                            <CustomForm
                                title={t("Email")}
                                handleChangeText={(text) => setForm({ ...form, email: text })}
                                value={form.email}
                                placeholder={t("Enter your email address")}
                            />
                            <CustomForm
                                title={t("Password")}
                                handleChangeText={(text) =>
                                    setForm({ ...form, password: text })
                                }
                                value={form.password}
                                placeholder={t("Enter your password")}
                            />

                            <CustomButton
                                title={t("Sign In")}
                                style="h-16 mt-6 py-3"
                                textStyle={"text-lg text-[#F5F5F5]"}
                                onPress={submit}
                                isLoading={isSubmitting}
                            />
                            <View className="items-center mt-6">
                                <Text className="text-[#808080]">
                                    {t("Do not have an account")} ?&nbsp;&nbsp;
                                    <Link href="/sign-up" className="text-secondary">
                                        {t("Sign up")}
                                    </Link>
                                </Text>
                            </View>

                            <View className="items-center mt-4">
                                <Text className="text-[#808080]">
                                    {t("Forgot your password")} ?&nbsp;&nbsp;
                                    <Link href="/pw-reset" className="text-secondary">
                                        {t("Reset")}
                                    </Link>
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <StatusBar style="dark" />
            </SafeAreaView>
        </>
    );
}
