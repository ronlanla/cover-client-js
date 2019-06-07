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
   * This test case covers:
   *  - conditional line 24 branch to line 25
   */

  @Test
  public void loginUserInputNotNullNullOutputFalse() {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "";
    final String password = null;

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }
}
