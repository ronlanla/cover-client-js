package com.diffblue.javademo;

import com.diffblue.javademo.UserAccess;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.Timeout;



public class UserAccess {

  @Rule
  public final Timeout globalTimeout = new Timeout(10000);

  // Test written by Diffblue Cover.
  @Test
  public void getCurrentUserOutputNull() {

    // Arrange
    final UserAccess userAccess = new UserAccess();

    // Act and Assert result
    Assert.assertNull(userAccess.getCurrentUser());

  }
}
