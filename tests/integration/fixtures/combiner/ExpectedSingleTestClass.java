package com.diffblue.javademo;

import com.diffblue.javademo.UserAccess;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.Timeout;



public class UserAccess {

  @Rule
  public final ExpectedException thrown = ExpectedException.none();

  @Rule
  public final Timeout globalTimeout = new Timeout(10000);

  /* testedClasses: UserAccessTest */
  /*
   * Test written by Diffblue Cover.
   * This test case covers the entire method.
   */

  @Test
  public void getCurrentUserOutputNull() {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();

    // Act
    final String retval = objectUnderTest.getCurrentUser();

    // Assert result
    Assert.assertNull(retval);

  }
}
