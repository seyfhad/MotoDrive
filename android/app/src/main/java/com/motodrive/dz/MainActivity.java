package com.motodrive.dz;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorcommunity.facebooklogin.FacebookLogin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(FacebookLogin.class);
    }
}
