package com.forge.training;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class ForgeUnitTest {
    @Test
    public void nativeApplicationIdMatchesForge() {
        assertEquals("com.forge.training", BuildConfig.APPLICATION_ID);
    }
}
